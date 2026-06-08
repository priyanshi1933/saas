"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = exports.date = exports.amount = exports.loginPassword = exports.password = exports.email = exports.optionalText = exports.requiredText = void 0;
const joi_1 = __importDefault(require("joi"));
const requiredText = (label, min = 2, max = 120) => joi_1.default.string().trim().min(min).max(max).required().messages({
    "string.empty": `${label} is required`,
    "string.min": `${label} must be at least ${min} characters`,
    "string.max": `${label} must be at most ${max} characters`,
    "any.required": `${label} is required`,
});
exports.requiredText = requiredText;
const optionalText = (label, max = 200) => joi_1.default.string().trim().max(max).allow("").messages({
    "string.max": `${label} must be at most ${max} characters`,
});
exports.optionalText = optionalText;
exports.email = joi_1.default.string().trim().lowercase().email({ tlds: false }).required().messages({
    "string.empty": "Email is required",
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
});
exports.password = joi_1.default.string().min(6).max(72).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password must be at most 72 characters",
    "any.required": "Password is required",
});
exports.loginPassword = joi_1.default.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
});
exports.amount = joi_1.default.number().positive().precision(2).required().messages({
    "number.base": "Amount must be a valid number",
    "number.positive": "Amount must be greater than zero",
    "any.required": "Amount is required",
});
const date = (label) => joi_1.default.date().iso().required().messages({
    "date.base": `${label} must be a valid date`,
    "date.format": `${label} must be a valid date`,
    "any.required": `${label} is required`,
});
exports.date = date;
const validateBody = (schema, body) => {
    const { error, value } = schema.validate(body, {
        abortEarly: false,
        convert: true,
        stripUnknown: true,
    });
    if (error) {
        throw new Error(error.details.map((detail) => detail.message).join(". "));
    }
    return value;
};
exports.validateBody = validateBody;
