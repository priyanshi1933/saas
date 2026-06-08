"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertStripePayment = exports.createPaymentForOrganization = exports.getPaymentsByOrganization = void 0;
const payment_model_1 = require("../models/payment.model");
const invoice_service_1 = require("./invoice.service");
const getPaymentsByOrganization = async (organizationId) => {
    return await payment_model_1.PaymentModel.find({ organizationId }).sort({ paidAt: -1 });
};
exports.getPaymentsByOrganization = getPaymentsByOrganization;
const createPaymentForOrganization = async (input) => {
    const payment = await payment_model_1.PaymentModel.create(input);
    if (input.invoiceId && input.status === "succeeded") {
        await (0, invoice_service_1.updateInvoiceStatus)(input.organizationId, input.invoiceId, "paid");
    }
    return payment;
};
exports.createPaymentForOrganization = createPaymentForOrganization;
const upsertStripePayment = async (input) => {
    if (!input.stripePaymentIntentId) {
        return await payment_model_1.PaymentModel.create(input);
    }
    return await payment_model_1.PaymentModel.findOneAndUpdate({ stripePaymentIntentId: input.stripePaymentIntentId }, { $set: input }, { new: true, upsert: true });
};
exports.upsertStripePayment = upsertStripePayment;
