"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = exports.getPayments = void 0;
const payment_service_1 = require("../services/payment.service");
const validation_1 = require("../validation");
const helpers_1 = require("./helpers");
const getPayments = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const payments = await (0, payment_service_1.getPaymentsByOrganization)(organizationId);
        res.json({ success: true, data: payments });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPayments = getPayments;
const createPayment = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const input = (0, validation_1.validateBody)(validation_1.paymentSchema, req.body);
        const payment = await (0, payment_service_1.createPaymentForOrganization)({
            organizationId,
            ...input,
            invoiceId: input.invoiceId || undefined,
        });
        res.status(201).json({ success: true, data: payment });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createPayment = createPayment;
