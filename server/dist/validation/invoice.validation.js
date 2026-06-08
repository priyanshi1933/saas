"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceSchema = exports.invoiceStatusValues = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
exports.invoiceStatusValues = ["draft", "pending", "paid", "overdue"];
const lineItemSchema = joi_1.default.object({
    description: (0, common_1.requiredText)("Description", 2, 120),
    quantity: joi_1.default.number().integer().positive().required().messages({
        "number.base": "Quantity must be a valid number",
        "number.integer": "Quantity must be a whole number",
        "number.positive": "Quantity must be greater than zero",
        "any.required": "Quantity is required",
    }),
    unitPrice: joi_1.default.number().precision(2).min(0).required().messages({
        "number.base": "Unit price must be a valid number",
        "number.min": "Unit price must be greater than or equal to zero",
        "any.required": "Unit price is required",
    }),
});
exports.invoiceSchema = joi_1.default.object({
    clientName: (0, common_1.requiredText)("Client name", 2, 80),
    invoiceNumber: (0, common_1.requiredText)("Invoice number", 2, 40).pattern(/^[A-Za-z0-9-]+$/).messages({
        "string.pattern.base": "Invoice number can only contain letters, numbers, and hyphens",
    }),
    status: joi_1.default.string()
        .valid(...exports.invoiceStatusValues)
        .default("draft")
        .messages({ "any.only": "Please select a valid invoice status" }),
    dueDate: (0, common_1.date)("Due date"),
    lineItems: joi_1.default.array().items(lineItemSchema).min(1).default([]).messages({
        "array.min": "At least one line item is required",
    }),
    taxRate: joi_1.default.number().min(0).precision(2).default(0).messages({
        "number.base": "Tax rate must be a valid number",
        "number.min": "Tax rate must be zero or greater",
    }),
    discountAmount: joi_1.default.number().min(0).precision(2).default(0).messages({
        "number.base": "Discount must be a valid number",
        "number.min": "Discount must be zero or greater",
    }),
});
