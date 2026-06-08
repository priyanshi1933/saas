"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.tenantSignupSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
const roleValues = ["owner", "admin", "member", "read_only"];
exports.registerSchema = joi_1.default.object({
    email: common_1.email,
    password: common_1.password,
    role: joi_1.default.string()
        .valid(...roleValues)
        .default("member")
        .messages({ "any.only": "Please select a valid role" }),
});
exports.tenantSignupSchema = joi_1.default.object({
    organizationName: (0, common_1.requiredText)("Organization name", 2, 80),
    email: common_1.email,
    password: common_1.password,
});
exports.loginSchema = joi_1.default.object({
    email: common_1.email,
    password: common_1.loginPassword,
});
