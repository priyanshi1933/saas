"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvitationSchema = exports.inviteSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
const inviteRoleValues = ["admin", "member", "read_only"];
exports.inviteSchema = joi_1.default.object({
    email: common_1.email,
    role: joi_1.default.string()
        .valid(...inviteRoleValues)
        .required()
        .messages({
        "any.only": "Please select a valid role",
        "any.required": "Role is required",
    }),
});
exports.acceptInvitationSchema = joi_1.default.object({
    token: (0, common_1.requiredText)("Invite token", 12, 200),
    email: common_1.email,
    password: common_1.password,
});
