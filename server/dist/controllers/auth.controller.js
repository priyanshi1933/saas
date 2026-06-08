"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.tenantSignupUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_service_1 = require("../services/auth.service");
const validation_1 = require("../validation");
const organization_model_1 = require("../models/organization.model");
dotenv_1.default.config({ path: ".env.local" });
const secret = process.env.JWT_SECRET;
const registerUser = async (req, res) => {
    try {
        const { email, password, role } = (0, validation_1.validateBody)(validation_1.registerSchema, req.body);
        const user = await (0, auth_service_1.register)(email, password, role);
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: { id: user._id, email: user.email },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.registerUser = registerUser;
const tenantSignupUser = async (req, res) => {
    try {
        const { email, password, organizationName, firstName, lastName } = (0, validation_1.validateBody)(validation_1.tenantSignupSchema, req.body);
        const result = await (0, auth_service_1.tenantSignup)(email, password, organizationName, firstName, lastName);
        const token = jsonwebtoken_1.default.sign({
            id: result.user._id,
            role: result.user.role,
            organizationId: result.user.organizationId,
        }, secret || "fallback_secret", { expiresIn: "1h" });
        res.status(201).json({
            success: true,
            message: "Tenant created successfully",
            data: {
                userId: result.user._id,
                organizationId: result.organization._id,
                organizationName: result.organization.name,
                role: result.user.role,
                token,
                firstName: result.user.firstName || "",
                lastName: result.user.lastName || "",
                email: result.user.email,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.tenantSignupUser = tenantSignupUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = (0, validation_1.validateBody)(validation_1.loginSchema, req.body);
        const user = await (0, auth_service_1.login)(email);
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ field: "password", message: "Password does not match" });
        }
        // Fetch organization name
        const organization = await organization_model_1.OrganizationModel.findById(user.organizationId);
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, organizationId: user.organizationId }, secret || "fallback_secret", { expiresIn: "1h" });
        res.cookie("token", token);
        res.json({
            token,
            role: user.role,
            organizationId: user.organizationId,
            id: user._id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email,
            organizationName: organization?.name || "",
        });
    }
    catch (error) {
        res.status(400).json({ field: "email", message: error.message });
    }
};
exports.loginUser = loginUser;
