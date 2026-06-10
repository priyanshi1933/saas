"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
<<<<<<< HEAD
exports.completeCheckoutLink = exports.getCheckoutLinkByToken = exports.createSubscriptionCheckoutLink = exports.createInvoiceCheckoutLink = void 0;
=======
exports.completeCheckoutLink = exports.createRazorpayCheckoutForToken = exports.getCheckoutLinkByToken = exports.createSubscriptionCheckoutLink = exports.createInvoiceCheckoutLink = void 0;
>>>>>>> c3eebe6 (first commit)
const crypto_1 = __importDefault(require("crypto"));
const checkoutLink_model_1 = require("../models/checkoutLink.model");
const invoice_model_1 = require("../models/invoice.model");
const subscription_model_1 = require("../models/subscription.model");
const payment_service_1 = require("./payment.service");
<<<<<<< HEAD
const newToken = () => crypto_1.default.randomBytes(24).toString("hex");
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";
=======
const razorpay_service_1 = require("./razorpay.service");
const subscription_service_1 = require("./subscription.service");
const newToken = () => crypto_1.default.randomBytes(24).toString("hex");
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";
const currency = () => (process.env.RAZORPAY_CURRENCY || "INR").toUpperCase();
>>>>>>> c3eebe6 (first commit)
const createInvoiceCheckoutLink = async (organizationId, invoiceId) => {
    const invoice = await invoice_model_1.InvoiceModel.findOne({ _id: invoiceId, organizationId });
    if (!invoice) {
        throw new Error("Invoice not found");
    }
    if (invoice.status === "paid") {
        throw new Error("Invoice is already paid");
    }
    const checkoutLink = await checkoutLink_model_1.CheckoutLinkModel.create({
        organizationId,
        resourceType: "invoice",
        resourceId: invoice._id,
        token: newToken(),
        clientName: invoice.clientName,
        title: `Invoice ${invoice.invoiceNumber}`,
        amount: invoice.amount,
        status: "active",
    });
    return {
        checkoutLink,
        url: `${clientUrl()}/checkout/${checkoutLink.token}`,
    };
};
exports.createInvoiceCheckoutLink = createInvoiceCheckoutLink;
const createSubscriptionCheckoutLink = async (organizationId, subscriptionId) => {
    const subscription = await subscription_model_1.SubscriptionModel.findOne({ _id: subscriptionId, organizationId });
    if (!subscription) {
        throw new Error("Subscription plan not found");
    }
    const checkoutLink = await checkoutLink_model_1.CheckoutLinkModel.create({
        organizationId,
        resourceType: "subscription",
        resourceId: subscription._id,
        token: newToken(),
        clientName: subscription.clientName,
        title: `${subscription.planName} (${subscription.billingCycle})`,
        amount: subscription.amount,
        status: "active",
    });
    return {
        checkoutLink,
        url: `${clientUrl()}/checkout/${checkoutLink.token}`,
    };
};
exports.createSubscriptionCheckoutLink = createSubscriptionCheckoutLink;
const getCheckoutLinkByToken = async (token) => {
    const checkoutLink = await checkoutLink_model_1.CheckoutLinkModel.findOne({ token });
    if (!checkoutLink) {
        throw new Error("Checkout link not found");
    }
    if (checkoutLink.status !== "active") {
        throw new Error("Checkout link is no longer active");
    }
    if (checkoutLink.expiresAt && checkoutLink.expiresAt < new Date()) {
        checkoutLink.status = "expired";
        await checkoutLink.save();
        throw new Error("Checkout link expired");
    }
    return checkoutLink;
};
exports.getCheckoutLinkByToken = getCheckoutLinkByToken;
<<<<<<< HEAD
const completeCheckoutLink = async (token) => {
    const checkoutLink = await (0, exports.getCheckoutLinkByToken)(token);
    await (0, payment_service_1.createPaymentForOrganization)({
        organizationId: checkoutLink.organizationId.toString(),
        clientName: checkoutLink.clientName,
        amount: checkoutLink.amount,
        provider: "Stripe (fake client checkout)",
        status: "succeeded",
        paidAt: new Date(),
    });
    if (checkoutLink.resourceType === "invoice") {
        await invoice_model_1.InvoiceModel.findOneAndUpdate({ _id: checkoutLink.resourceId, organizationId: checkoutLink.organizationId }, { status: "paid" }, { new: true });
    }
    if (checkoutLink.resourceType === "subscription") {
        await subscription_model_1.SubscriptionModel.findOneAndUpdate({ _id: checkoutLink.resourceId, organizationId: checkoutLink.organizationId }, { status: "active" }, { new: true });
    }
=======
const createRazorpayCheckoutForToken = async (token) => {
    const checkoutLink = await (0, exports.getCheckoutLinkByToken)(token);
    const notes = {
        organizationId: checkoutLink.organizationId.toString(),
        checkoutToken: checkoutLink.token,
        resourceType: checkoutLink.resourceType,
        resourceId: checkoutLink.resourceId.toString(),
    };
    if (checkoutLink.resourceType === "invoice") {
        const order = await (0, razorpay_service_1.createRazorpayOrder)({
            amount: checkoutLink.amount,
            currency: currency(),
            receipt: `invoice_${checkoutLink._id.toString().slice(-16)}`,
            notes,
        });
        checkoutLink.razorpayOrderId = order.id;
        await checkoutLink.save();
        return {
            key: (0, razorpay_service_1.getRazorpayKeyId)(),
            name: "Agency Billing",
            description: checkoutLink.title,
            amount: order.amount,
            currency: order.currency,
            order_id: order.id,
            notes,
        };
    }
    const subscription = await subscription_model_1.SubscriptionModel.findOne({
        _id: checkoutLink.resourceId,
        organizationId: checkoutLink.organizationId,
    });
    if (!subscription) {
        throw new Error("Subscription plan not found");
    }
    const plan = await (0, razorpay_service_1.createRazorpayPlan)({
        planName: subscription.planName,
        amount: subscription.amount,
        currency: currency(),
        billingCycle: subscription.billingCycle,
    });
    const razorpaySubscription = await (0, razorpay_service_1.createRazorpaySubscription)({
        planId: plan.id,
        totalCount: subscription.billingCycle === "yearly" ? 5 : 60,
        notes,
    });
    checkoutLink.razorpayPlanId = plan.id;
    checkoutLink.razorpaySubscriptionId = razorpaySubscription.id;
    await checkoutLink.save();
    subscription.razorpayPlanId = plan.id;
    subscription.razorpaySubscriptionId = razorpaySubscription.id;
    await subscription.save();
    return {
        key: (0, razorpay_service_1.getRazorpayKeyId)(),
        name: "Agency Billing",
        description: checkoutLink.title,
        amount: Math.round(checkoutLink.amount * 100),
        currency: currency(),
        subscription_id: razorpaySubscription.id,
        notes,
    };
};
exports.createRazorpayCheckoutForToken = createRazorpayCheckoutForToken;
const completeCheckoutLink = async (token, payload) => {
    const checkoutLink = await (0, exports.getCheckoutLinkByToken)(token);
    const paymentId = payload.razorpay_payment_id;
    const signature = payload.razorpay_signature;
    if (!paymentId || !signature) {
        throw new Error("Razorpay payment verification details are required");
    }
    let invoiceId;
    let razorpayOrderId;
    let razorpaySubscriptionId;
    if (checkoutLink.resourceType === "invoice") {
        razorpayOrderId = payload.razorpay_order_id || checkoutLink.razorpayOrderId;
        if (!razorpayOrderId || !(0, razorpay_service_1.verifyRazorpayOrderSignature)({ orderId: razorpayOrderId, paymentId, signature })) {
            throw new Error("Razorpay payment signature verification failed");
        }
        invoiceId = checkoutLink.resourceId.toString();
    }
    if (checkoutLink.resourceType === "subscription") {
        razorpaySubscriptionId = payload.razorpay_subscription_id || checkoutLink.razorpaySubscriptionId;
        if (!razorpaySubscriptionId ||
            !(0, razorpay_service_1.verifyRazorpaySubscriptionSignature)({ subscriptionId: razorpaySubscriptionId, paymentId, signature })) {
            throw new Error("Razorpay subscription signature verification failed");
        }
        const subscription = await (0, subscription_service_1.activateSubscription)({
            organizationId: checkoutLink.organizationId.toString(),
            subscriptionId: checkoutLink.resourceId.toString(),
            razorpaySubscriptionId,
            razorpayPlanId: checkoutLink.razorpayPlanId,
        });
        invoiceId = subscription.currentInvoiceId?.toString();
    }
    await (0, payment_service_1.upsertRazorpayPayment)({
        organizationId: checkoutLink.organizationId.toString(),
        invoiceId,
        clientName: checkoutLink.clientName,
        amount: checkoutLink.amount,
        provider: "Razorpay Test",
        status: "succeeded",
        paidAt: new Date(),
        razorpayPaymentId: paymentId,
        razorpayOrderId,
        razorpaySubscriptionId,
    });
>>>>>>> c3eebe6 (first commit)
    checkoutLink.status = "completed";
    checkoutLink.completedAt = new Date();
    await checkoutLink.save();
    return checkoutLink;
};
exports.completeCheckoutLink = completeCheckoutLink;
