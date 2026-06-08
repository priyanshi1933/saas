"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookHandler = exports.createStripeSubscriptionSessionController = exports.createStripePaymentSessionController = void 0;
const helpers_1 = require("./helpers");
const stripe_service_1 = require("../services/stripe.service");
const createStripePaymentSessionController = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const { clientName, amount } = req.body;
        if (!clientName || typeof clientName !== "string") {
            throw new Error("clientName is required");
        }
        if (!amount || Number(amount) <= 0) {
            throw new Error("amount must be a positive number");
        }
        const session = await (0, stripe_service_1.createStripePaymentSession)({
            organizationId,
            clientName,
            amount: Number(amount),
        });
        res.status(201).json({ success: true, url: session.url });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createStripePaymentSessionController = createStripePaymentSessionController;
const createStripeSubscriptionSessionController = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const { clientName, planName, amount, billingCycle } = req.body;
        if (!clientName || typeof clientName !== "string") {
            throw new Error("clientName is required");
        }
        if (!planName || typeof planName !== "string") {
            throw new Error("planName is required");
        }
        if (!amount || Number(amount) <= 0) {
            throw new Error("amount must be a positive number");
        }
        if (billingCycle !== "monthly" && billingCycle !== "yearly") {
            throw new Error("billingCycle must be monthly or yearly");
        }
        const session = await (0, stripe_service_1.createStripeSubscriptionSession)({
            organizationId,
            clientName,
            planName,
            amount: Number(amount),
            billingCycle,
        });
        res.status(201).json({ success: true, url: session.url });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createStripeSubscriptionSessionController = createStripeSubscriptionSessionController;
const stripeWebhookHandler = async (req, res) => {
    try {
        const signature = req.headers["stripe-signature"];
        const event = (0, stripe_service_1.constructStripeEvent)(req.body, signature);
        await (0, stripe_service_1.handleStripeEvent)(event);
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Stripe webhook error:", error);
        res.status(400).json({ message: error.message || "Webhook error" });
    }
};
exports.stripeWebhookHandler = stripeWebhookHandler;
