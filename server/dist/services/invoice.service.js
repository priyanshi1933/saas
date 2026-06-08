"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoiceForOrganization = exports.updateInvoiceStatus = exports.getInvoicesByOrganization = void 0;
const invoice_model_1 = require("../models/invoice.model");
const getInvoicesByOrganization = async (organizationId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await invoice_model_1.InvoiceModel.updateMany({
        organizationId,
        status: "pending",
        dueDate: { $lt: today },
    }, { $set: { status: "overdue" } });
    return await invoice_model_1.InvoiceModel.find({ organizationId }).sort({ createdAt: -1 });
};
exports.getInvoicesByOrganization = getInvoicesByOrganization;
const updateInvoiceStatus = async (organizationId, invoiceId, status) => {
    return await invoice_model_1.InvoiceModel.findOneAndUpdate({ _id: invoiceId, organizationId }, { status }, { new: true });
};
exports.updateInvoiceStatus = updateInvoiceStatus;
const createInvoiceForOrganization = async (input) => {
    return await invoice_model_1.InvoiceModel.create(input);
};
exports.createInvoiceForOrganization = createInvoiceForOrganization;
