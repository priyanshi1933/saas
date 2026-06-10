"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayWebhookSignature = exports.getRazorpayKeyId = exports.verifyRazorpaySubscriptionSignature = exports.verifyRazorpayOrderSignature = exports.createRazorpaySubscription = exports.createRazorpayPlan = exports.createRazorpayOrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
const baseUrl = "https://api.razorpay.com/v1";
const assertConfigured = () => {
    if (!keyId || !keySecret) {
        throw new Error("Razorpay test keys are required. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env.local.");
    }
};
const paise = (amount) => Math.round(amount * 100);
const request = async ({ method, path: requestPath, body }) => {
    assertConfigured();
    const response = await fetch(`${baseUrl}${requestPath}`, {
        method,
        headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await response.json());
    if (!response.ok) {
        throw new Error(data.error?.description || "Razorpay request failed");
    }
    return data;
};
const createRazorpayOrder = async ({ amount, currency, receipt, notes, }) => {
    return request({
        method: "POST",
        path: "/orders",
        body: {
            amount: paise(amount),
            currency,
            receipt,
            notes,
        },
    });
};
exports.createRazorpayOrder = createRazorpayOrder;
const createRazorpayPlan = async ({ planName, amount, currency, billingCycle, }) => {
    return request({
        method: "POST",
        path: "/plans",
        body: {
            period: billingCycle,
            interval: 1,
            item: {
                name: planName,
                amount: paise(amount),
                currency,
            },
        },
    });
};
exports.createRazorpayPlan = createRazorpayPlan;
const createRazorpaySubscription = async ({ planId, totalCount, notes, }) => {
    return request({
        method: "POST",
        path: "/subscriptions",
        body: {
            plan_id: planId,
            total_count: totalCount,
            notes,
        },
    });
};
exports.createRazorpaySubscription = createRazorpaySubscription;
const digest = (value) => crypto_1.default.createHmac("sha256", keySecret).update(value).digest("hex");
const verifyRazorpayOrderSignature = ({ orderId, paymentId, signature, }) => {
    assertConfigured();
    return digest(`${orderId}|${paymentId}`) === signature;
};
exports.verifyRazorpayOrderSignature = verifyRazorpayOrderSignature;
const verifyRazorpaySubscriptionSignature = ({ subscriptionId, paymentId, signature, }) => {
    assertConfigured();
    return digest(`${paymentId}|${subscriptionId}`) === signature;
};
exports.verifyRazorpaySubscriptionSignature = verifyRazorpaySubscriptionSignature;
const getRazorpayKeyId = () => {
    assertConfigured();
    return keyId;
};
exports.getRazorpayKeyId = getRazorpayKeyId;
const verifyRazorpayWebhookSignature = ({ payload, signature, }) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error("RAZORPAY_WEBHOOK_SECRET is required for Razorpay webhook handling");
    }
    if (!signature) {
        throw new Error("Razorpay webhook signature is missing");
    }
    const expected = crypto_1.default.createHmac("sha256", webhookSecret).update(payload).digest("hex");
    return expected === signature;
};
exports.verifyRazorpayWebhookSignature = verifyRazorpayWebhookSignature;
