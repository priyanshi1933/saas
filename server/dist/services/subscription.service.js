"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertStripeSubscription = exports.createSubscriptionForOrganization = exports.getSubscriptionsByOrganization = void 0;
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
        status: input.status || "active",
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
    return { subscription, invoice };
};
exports.createSubscriptionForOrganization = createSubscriptionForOrganization;
const upsertStripeSubscription = async (input) => {
    if (!input.stripeSubscriptionId) {
        return await subscription_model_1.SubscriptionModel.create(input);
    }
    return await subscription_model_1.SubscriptionModel.findOneAndUpdate({ stripeSubscriptionId: input.stripeSubscriptionId }, {
        $set: {
            organizationId: input.organizationId,
            clientName: input.clientName,
            planName: input.planName,
            amount: input.amount,
            billingCycle: input.billingCycle,
            status: input.status || "active",
            nextBillingDate: input.nextBillingDate || new Date(),
            stripeSubscriptionId: input.stripeSubscriptionId,
            stripeCustomerId: input.stripeCustomerId,
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
        },
    }, { new: true, upsert: true });
};
exports.upsertStripeSubscription = upsertStripeSubscription;
