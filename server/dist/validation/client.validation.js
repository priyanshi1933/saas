"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
const currencyValues = ["USD", "INR", "EUR", "GBP", "AUD", "CAD"];
exports.clientSchema = joi_1.default.object({
    name: (0, common_1.requiredText)("Client name", 2, 80),
    taxId: (0, common_1.optionalText)("Tax ID", 40),
    billingAddress: (0, common_1.optionalText)("Billing address", 300),
    currency: joi_1.default.string()
        .valid(...currencyValues)
        .default("USD")
        .messages({ "any.only": "Please select a valid currency" }),
});
