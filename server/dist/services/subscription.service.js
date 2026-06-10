"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
<<<<<<< HEAD
exports.upsertStripeSubscription = exports.createSubscriptionForOrganization = exports.getSubscriptionsByOrganization = void 0;
=======
exports.upsertRazorpaySubscription = exports.activateSubscription = exports.createSubscriptionForOrganization = exports.getSubscriptionsByOrganization = void 0;
>>>>>>> c3eebe6 (first commit)
const subscription_model_1 = require("../models/subscription.model");
const invoice_service_1 = require("./invoice.service");
const getSubscriptionsByOrganization = async (organizationId) => {
    return await subscription_model_1.SubscriptionModel.find({ organizationId }).sort({ createdAt: -1 });
};
exports.getSubscriptionsByOrganization = getSubscriptionsByOrganization;
const createSubscriptionForOrganization = async (input) => {
    const now = new Date();
    const nextBillingDate = input.nextBillingDate ? new Date(input.nextBillingDate) : new Date(now);
    if (!input.nextBillingDate) {
        if (input.billingCycle === "yearly") {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }
        else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
    }
    const subscription = await subscription_model_1.SubscriptionModel.create({
        ...input,
<<<<<<< HEAD
        status: input.status || "active",
=======
        status: input.status || "trial",
>>>>>>> c3eebe6 (first commit)
        nextBillingDate,
    });
    const invoiceNumber = `SUB-${subscription._id.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const invoice = await (0, invoice_service_1.createInvoiceForOrganization)({
        organizationId: input.organizationId,
        clientName: input.clientName,
        invoiceNumber,
        status: "pending",
        dueDate: nextBillingDate,
        lineItems: [
            {
                description: `${input.planName} ${input.billingCycle} subscription`,
                quantity: 1,
                unitPrice: input.amount,
                total: input.amount,
            },
        ],
        subtotal: input.amount,
        taxRate: 0,
        discountAmount: 0,
        amount: input.amount,
    });
<<<<<<< HEAD
    return { subscription, invoice };
};
exports.createSubscriptionForOrganization = createSubscriptionForOrganization;
const upsertStripeSubscription = async (input) => {
    if (!input.stripeSubscriptionId) {
        return await subscription_model_1.SubscriptionModel.create(input);
    }
    return await subscription_model_1.SubscriptionModel.findOneAndUpdate({ stripeSubscriptionId: input.stripeSubscriptionId }, {
=======
    subscription.currentInvoiceId = invoice._id;
    await subscription.save();
    return { subscription, invoice };
};
exports.createSubscriptionForOrganization = createSubscriptionForOrganization;
const activateSubscription = async ({ organizationId, subscriptionId, razorpaySubscriptionId, razorpayPlanId, }) => {
    const subscription = await subscription_model_1.SubscriptionModel.findOne({ _id: subscriptionId, organizationId });
    if (!subscription) {
        throw new Error("Subscription plan not found");
    }
    const nextBillingDate = new Date();
    if (subscription.billingCycle === "yearly") {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }
    else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    subscription.status = "active";
    subscription.nextBillingDate = nextBillingDate;
    if (razorpaySubscriptionId) {
        subscription.razorpaySubscriptionId = razorpaySubscriptionId;
    }
    if (razorpayPlanId) {
        subscription.razorpayPlanId = razorpayPlanId;
    }
    await subscription.save();
    return subscription;
};
exports.activateSubscription = activateSubscription;
const upsertRazorpaySubscription = async (input) => {
    if (!input.razorpaySubscriptionId) {
        return await subscription_model_1.SubscriptionModel.create(input);
    }
    return await subscription_model_1.SubscriptionModel.findOneAndUpdate({ razorpaySubscriptionId: input.razorpaySubscriptionId }, {
>>>>>>> c3eebe6 (first commit)
        $set: {
            organizationId: input.organizationId,
            clientName: input.clientName,
            planName: input.planName,
            amount: input.amount,
            billingCycle: input.billingCycle,
            status: input.status || "active",
            nextBillingDate: input.nextBillingDate || new Date(),
<<<<<<< HEAD
            stripeSubscriptionId: input.stripeSubscriptionId,
            stripeCustomerId: input.stripeCustomerId,
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
        },
    }, { new: true, upsert: true });
};
exports.upsertStripeSubscription = upsertStripeSubscription;
=======
            currentInvoiceId: input.currentInvoiceId,
            razorpaySubscriptionId: input.razorpaySubscriptionId,
            razorpayPlanId: input.razorpayPlanId,
        },
    }, { new: true, upsert: true });
};
exports.upsertRazorpaySubscription = upsertRazorpaySubscription;
>>>>>>> c3eebe6 (first commit)
