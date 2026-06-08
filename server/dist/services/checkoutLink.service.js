"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeCheckoutLink = exports.getCheckoutLinkByToken = exports.createSubscriptionCheckoutLink = exports.createInvoiceCheckoutLink = void 0;
const crypto_1 = __importDefault(require("crypto"));
const checkoutLink_model_1 = require("../models/checkoutLink.model");
const invoice_model_1 = require("../models/invoice.model");
const subscription_model_1 = require("../models/subscription.model");
const payment_service_1 = require("./payment.service");
const newToken = () => crypto_1.default.randomBytes(24).toString("hex");
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";
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
    checkoutLink.status = "completed";
    checkoutLink.completedAt = new Date();
    await checkoutLink.save();
    return checkoutLink;
};
exports.completeCheckoutLink = completeCheckoutLink;
