"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
const billingCycleValues = ["monthly", "yearly"];
exports.subscriptionSchema = joi_1.default.object({
    clientName: (0, common_1.requiredText)("Client name", 2, 80),
    planName: (0, common_1.requiredText)("Plan name", 2, 80),
    amount: common_1.amount,
    billingCycle: joi_1.default.string()
        .valid(...billingCycleValues)
        .default("monthly")
        .messages({ "any.only": "Please select a valid billing cycle" }),
});
