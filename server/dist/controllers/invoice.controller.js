"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoiceStatus = exports.createInvoice = exports.getInvoices = void 0;
const joi_1 = __importDefault(require("joi"));
const invoice_service_1 = require("../services/invoice.service");
const validation_1 = require("../validation");
const helpers_1 = require("./helpers");
const getInvoices = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const invoices = await (0, invoice_service_1.getInvoicesByOrganization)(organizationId);
        res.json({ success: true, data: invoices });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getInvoices = getInvoices;
const createInvoice = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const input = (0, validation_1.validateBody)(validation_1.invoiceSchema, req.body);
        const lineItems = input.lineItems;
        const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxAmount = Math.round((subtotal * (input.taxRate || 0)) / 100 * 100) / 100;
        const amount = Math.max(0, subtotal + taxAmount - (input.discountAmount || 0));
        const invoice = await (0, invoice_service_1.createInvoiceForOrganization)({
            organizationId,
            clientName: input.clientName,
            invoiceNumber: input.invoiceNumber,
            status: input.status,
            dueDate: input.dueDate,
            lineItems: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: Math.round(item.quantity * item.unitPrice * 100) / 100,
            })),
            subtotal: Math.round(subtotal * 100) / 100,
            taxRate: input.taxRate || 0,
            discountAmount: input.discountAmount || 0,
            amount: Math.round(amount * 100) / 100,
        });
        res.status(201).json({ success: true, data: invoice });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createInvoice = createInvoice;
const updateInvoiceStatus = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const statusSchema = joi_1.default.object({
            status: joi_1.default.string()
                .valid(...validation_1.invoiceStatusValues)
                .required()
                .messages({
                "any.only": "Please select a valid invoice status",
                "any.required": "Invoice status is required",
            }),
        });
        const { status } = (0, validation_1.validateBody)(statusSchema, req.body);
        const updatedInvoice = await (0, invoice_service_1.updateInvoiceStatus)(organizationId, invoiceId, status);
        if (!updatedInvoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.json({ success: true, data: updatedInvoice });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
