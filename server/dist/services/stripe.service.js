"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeEvent = exports.constructStripeEvent = exports.createStripeSubscriptionSession = exports.createStripePaymentSession = void 0;
const stripe_1 = __importDefault(require("stripe"));
const payment_service_1 = require("./payment.service");
const subscription_service_1 = require("./subscription.service");
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const isFakeStripe = process.env.FAKE_STRIPE === "true" || !stripeSecretKey;
if (!stripeSecretKey && process.env.FAKE_STRIPE !== "true") {
    console.warn("Stripe secret key is missing. Falling back to fake Stripe mode.");
}
const stripe = !isFakeStripe
    ? new stripe_1.default(stripeSecretKey, {
        apiVersion: "2026-05-27.dahlia",
    })
    : null;
const cents = (value) => Math.round(value * 100);
const getMetadata = (metadata, key, fallback = "") => {
    return (metadata && metadata[key]) || fallback;
};
const createStripePaymentSession = async ({ organizationId, clientName, amount, }) => {
    if (isFakeStripe) {
        await (0, payment_service_1.createPaymentForOrganization)({
            organizationId,
            clientName,
            amount,
            provider: "Stripe (fake)",
            status: "succeeded",
            paidAt: new Date(),
        });
        return {
            url: `${process.env.CLIENT_URL || "http://localhost:5173"}/?fake_payment_success=true`,
        };
    }
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `One-off payment for ${clientName}`,
                        metadata: {
                            organizationId,
                            clientName,
                        },
                    },
                    unit_amount: cents(amount),
                },
                quantity: 1,
            },
        ],
        metadata: {
            organizationId,
            clientName,
            provider: "Stripe",
        },
        success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/?stripe_success=true`,
        cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/?stripe_canceled=true`,
    });
    return session;
};
exports.createStripePaymentSession = createStripePaymentSession;
const createStripeSubscriptionSession = async ({ organizationId, clientName, planName, amount, billingCycle, }) => {
    if (isFakeStripe) {
        await (0, subscription_service_1.createSubscriptionForOrganization)({
            organizationId,
            clientName,
            planName,
            amount,
            billingCycle,
        });
        return {
            url: `${process.env.CLIENT_URL || "http://localhost:5173"}/?fake_subscription_success=true`,
        };
    }
    const customer = await stripe.customers.create({
        metadata: {
            organizationId,
            clientName,
            planName,
            billingCycle,
        },
    });
    const product = await stripe.products.create({
        name: planName,
        metadata: {
            organizationId,
            clientName,
            planName,
            billingCycle,
        },
    });
    const price = await stripe.prices.create({
        unit_amount: cents(amount),
        currency: "usd",
        recurring: {
            interval: billingCycle === "yearly" ? "year" : "month",
        },
        product: product.id,
        metadata: {
            organizationId,
            clientName,
            planName,
            billingCycle,
        },
    });
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customer.id,
        line_items: [
            {
                price: price.id,
                quantity: 1,
            },
        ],
        metadata: {
            organizationId,
            clientName,
            planName,
            billingCycle,
        },
        success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/?stripe_success=true`,
        cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/?stripe_canceled=true`,
    });
    return session;
};
exports.createStripeSubscriptionSession = createStripeSubscriptionSession;
const constructStripeEvent = (payload, signature) => {
    if (isFakeStripe) {
        try {
            return JSON.parse(payload.toString());
        }
        catch (error) {
            throw new Error("Invalid fake Stripe event payload");
        }
    }
    if (!stripeWebhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET is required for Stripe webhook handling");
    }
    if (!signature) {
        throw new Error("Stripe signature header is missing");
    }
    return stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
};
exports.constructStripeEvent = constructStripeEvent;
const resolveSubscriptionPayload = async (subscriptionId, metadata) => {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price.product"],
    });
    const item = subscription.items.data[0];
    const productInfo = item.price.product;
    const productName = typeof productInfo === "string" ? undefined : productInfo?.name;
    const planName = metadata?.planName || String(productName || "Subscription plan");
    const billingCycle = (item.price.recurring?.interval === "year" ? "yearly" : "monthly");
    const amount = item.price.unit_amount ? item.price.unit_amount / 100 : 0;
    return {
        subscription: subscription,
        planName,
        billingCycle,
        amount,
    };
};
const createPaymentRecord = async ({ organizationId, clientName, amount, status, stripePaymentIntentId, stripeCheckoutSessionId, }) => {
    const paymentInput = {
        organizationId,
        clientName,
        amount,
        provider: "Stripe",
        status,
        paidAt: new Date(),
        stripePaymentIntentId,
        stripeCheckoutSessionId,
    };
    await (0, payment_service_1.upsertStripePayment)(paymentInput);
};
const createOrUpdateSubscriptionRecord = async ({ organizationId, clientName, planName, amount, billingCycle, status, nextBillingDate, stripeSubscriptionId, stripeCustomerId, stripeCheckoutSessionId, }) => {
    const subscriptionInput = {
        organizationId,
        clientName,
        planName,
        amount,
        billingCycle,
        status,
        nextBillingDate: nextBillingDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        stripeSubscriptionId,
        stripeCustomerId,
        stripeCheckoutSessionId,
    };
    await (0, subscription_service_1.upsertStripeSubscription)(subscriptionInput);
};
const handleStripeEvent = async (event) => {
    const data = event.data.object;
    const metadata = data.metadata || {};
    const organizationId = getMetadata(metadata, "organizationId");
    const clientName = getMetadata(metadata, "clientName", "Customer");
    if (!organizationId) {
        console.warn("Stripe webhook received without organizationId metadata, ignoring event.");
        return;
    }
    switch (event.type) {
        case "checkout.session.completed": {
            const session = data;
            if (session.mode === "payment" && session.payment_intent) {
                const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
                const amount = session.amount_total ? session.amount_total / 100 : 0;
                await createPaymentRecord({
                    organizationId,
                    clientName,
                    amount,
                    status: "succeeded",
                    stripePaymentIntentId: paymentIntentId,
                    stripeCheckoutSessionId: session.id || undefined,
                });
            }
            if (session.mode === "subscription" && typeof session.subscription === "string") {
                const payload = await resolveSubscriptionPayload(session.subscription, metadata);
                await createOrUpdateSubscriptionRecord({
                    organizationId,
                    clientName,
                    planName: payload.planName,
                    amount: payload.amount,
                    billingCycle: payload.billingCycle,
                    status: "active",
                    nextBillingDate: payload.subscription.current_period_end
                        ? new Date(payload.subscription.current_period_end * 1000)
                        : undefined,
                    stripeSubscriptionId: payload.subscription.id,
                    stripeCustomerId: typeof payload.subscription.customer === "string" ? payload.subscription.customer : payload.subscription.customer.id,
                    stripeCheckoutSessionId: session.id || undefined,
                });
            }
            break;
        }
        case "payment_intent.succeeded": {
            const paymentIntent = data;
            const amount = paymentIntent.amount_received ? paymentIntent.amount_received / 100 : paymentIntent.amount ? paymentIntent.amount / 100 : 0;
            await createPaymentRecord({
                organizationId,
                clientName,
                amount,
                status: "succeeded",
                stripePaymentIntentId: paymentIntent.id,
            });
            break;
        }
        case "invoice.payment_succeeded": {
            const invoice = data;
            const amount = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
            const sessionId = typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent?.id;
            await createPaymentRecord({
                organizationId,
                clientName,
                amount,
                status: "succeeded",
                stripePaymentIntentId: sessionId || undefined,
                stripeCheckoutSessionId: invoice.subscription ? invoice.id : undefined,
            });
            if (invoice.subscription && typeof invoice.subscription === "string") {
                const payload = await resolveSubscriptionPayload(invoice.subscription, metadata);
                await createOrUpdateSubscriptionRecord({
                    organizationId,
                    clientName,
                    planName: payload.planName,
                    amount: payload.amount,
                    billingCycle: payload.billingCycle,
                    status: "active",
                    nextBillingDate: payload.subscription.current_period_end
                        ? new Date(payload.subscription.current_period_end * 1000)
                        : undefined,
                    stripeSubscriptionId: payload.subscription.id,
                    stripeCustomerId: typeof payload.subscription.customer === "string" ? payload.subscription.customer : payload.subscription.customer.id,
                    stripeCheckoutSessionId: invoice.id,
                });
            }
            break;
        }
        case "invoice.payment_failed": {
            const invoice = data;
            const amount = invoice.amount_due ? invoice.amount_due / 100 : 0;
            await createPaymentRecord({
                organizationId,
                clientName,
                amount,
                status: "failed",
                stripeCheckoutSessionId: invoice.id,
            });
            if (invoice.subscription && typeof invoice.subscription === "string") {
                const payload = await resolveSubscriptionPayload(invoice.subscription, metadata);
                await createOrUpdateSubscriptionRecord({
                    organizationId,
                    clientName,
                    planName: payload.planName,
                    amount: payload.amount,
                    billingCycle: payload.billingCycle,
                    status: "paused",
                    nextBillingDate: payload.subscription.current_period_end
                        ? new Date(payload.subscription.current_period_end * 1000)
                        : undefined,
                    stripeSubscriptionId: payload.subscription.id,
                    stripeCustomerId: typeof payload.subscription.customer === "string" ? payload.subscription.customer : payload.subscription.customer.id,
                    stripeCheckoutSessionId: invoice.id,
                });
            }
            break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
            const subscription = data;
            const plan = subscription.items.data[0]?.price;
            const productInfo = plan?.product;
            const productName = typeof productInfo === "string" ? undefined : productInfo?.name;
            const planName = getMetadata(subscription.metadata, "planName") || String(productName || "Subscription plan");
            const billingCycle = (plan?.recurring?.interval === "year" ? "yearly" : "monthly");
            const amount = plan?.unit_amount ? plan.unit_amount / 100 : 0;
            await createOrUpdateSubscriptionRecord({
                organizationId,
                clientName,
                planName,
                amount,
                billingCycle,
                status: subscription.status === "active" ? "active" : subscription.status === "canceled" ? "canceled" : "paused",
                nextBillingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
                stripeCheckoutSessionId: getMetadata(subscription.metadata, "stripeCheckoutSessionId") || undefined,
            });
            break;
        }
        case "customer.subscription.deleted": {
            const subscription = data;
            const plan = subscription.items.data[0]?.price;
            const productInfo = plan?.product;
            const productName = typeof productInfo === "string" ? undefined : productInfo?.name;
            const planName = getMetadata(subscription.metadata, "planName") || String(productName || "Subscription plan");
            const billingCycle = (plan?.recurring?.interval === "year" ? "yearly" : "monthly");
            const amount = plan?.unit_amount ? plan.unit_amount / 100 : 0;
            await createOrUpdateSubscriptionRecord({
                organizationId,
                clientName,
                planName,
                amount,
                billingCycle,
                status: "canceled",
                nextBillingDate: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
            });
            break;
        }
        default:
            break;
    }
};
exports.handleStripeEvent = handleStripeEvent;
