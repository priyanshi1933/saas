"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
const paymentStatusValues = ["succeeded", "pending", "failed"];
exports.paymentSchema = joi_1.default.object({
    invoiceId: joi_1.default.string().hex().length(24).optional().allow("").messages({
        "string.hex": "Please select a valid invoice",
        "string.length": "Please select a valid invoice",
    }),
    clientName: (0, common_1.requiredText)("Client name", 2, 80),
    amount: common_1.amount,
    provider: (0, common_1.requiredText)("Provider", 2, 60).default("Online"),
    status: joi_1.default.string()
        .valid(...paymentStatusValues)
        .default("pending")
        .messages({ "any.only": "Please select a valid payment status" }),
    paidAt: joi_1.default.date().iso().default(() => new Date()).messages({
        "date.base": "Paid date must be a valid date",
        "date.format": "Paid date must be a valid date",
    }),
});
