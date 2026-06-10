"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhookHandler = void 0;
const subscription_model_1 = require("../models/subscription.model");
const payment_service_1 = require("../services/payment.service");
const razorpay_service_1 = require("../services/razorpay.service");
const rupees = (amount) => Math.round(((amount || 0) / 100) * 100) / 100;
const nextBillingDate = (currentEnd) => {
    if (currentEnd) {
        return new Date(currentEnd * 1000);
    }
    return undefined;
};
const razorpayWebhookHandler = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const payload = req.body;
        if (!(0, razorpay_service_1.verifyRazorpayWebhookSignature)({ payload, signature })) {
            throw new Error("Invalid Razorpay webhook signature");
        }
        const event = JSON.parse(payload.toString());
        const subscriptionEntity = event.payload?.subscription?.entity;
        const paymentEntity = event.payload?.payment?.entity;
        if (event.event === "subscription.charged" && subscriptionEntity && paymentEntity) {
            const subscription = await subscription_model_1.SubscriptionModel.findOne({
                razorpaySubscriptionId: subscriptionEntity.id,
            });
            if (subscription) {
                subscription.status = "active";
                const nextDate = nextBillingDate(subscriptionEntity.current_end);
                if (nextDate) {
                    subscription.nextBillingDate = nextDate;
                }
                await subscription.save();
                await (0, payment_service_1.upsertRazorpayPayment)({
                    organizationId: subscription.organizationId.toString(),
                    clientName: subscription.clientName,
                    amount: rupees(paymentEntity.amount),
                    provider: "Razorpay Test",
                    status: paymentEntity.status === "captured" ? "succeeded" : "pending",
                    paidAt: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),
                    razorpayPaymentId: paymentEntity.id,
                    razorpaySubscriptionId: subscriptionEntity.id,
                });
            }
        }
        if (event.event === "subscription.cancelled" && subscriptionEntity) {
            await subscription_model_1.SubscriptionModel.findOneAndUpdate({ razorpaySubscriptionId: subscriptionEntity.id }, { status: "canceled" }, { new: true });
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Razorpay webhook error:", error);
        res.status(400).json({ message: error.message || "Webhook error" });
    }
};
exports.razorpayWebhookHandler = razorpayWebhookHandler;
