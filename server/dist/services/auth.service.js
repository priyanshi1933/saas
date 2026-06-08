"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.tenantSignup = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const organization_model_1 = require("../models/organization.model");
const user_model_1 = require("../models/user.model");
const register = async (email, password, role) => {
    const existingUser = await user_model_1.UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new Error("Email already exists");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    return await user_model_1.UserModel.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || "member",
    });
};
exports.register = register;
const tenantSignup = async (email, password, organizationName, firstName, lastName) => {
    const existingUser = await user_model_1.UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new Error("Email already exists");
    }
    const existingOrg = await organization_model_1.OrganizationModel.findOne({ name: organizationName.trim() });
    if (existingOrg) {
        throw new Error("Organization already exists");
    }
    let organization = null;
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const ownerId = new mongoose_1.Types.ObjectId();
        organization = await organization_model_1.OrganizationModel.create({
            name: organizationName.trim(),
            owner: ownerId,
            members: [ownerId],
        });
        const ownerUser = await user_model_1.UserModel.create({
            _id: ownerId,
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName: firstName || "",
            lastName: lastName || "",
            role: "owner",
            organizationId: organization._id,
        });
        return { organization, user: ownerUser };
    }
    catch (error) {
        if (organization) {
            await organization_model_1.OrganizationModel.findByIdAndDelete(organization._id);
        }
        throw error;
    }
};
exports.tenantSignup = tenantSignup;
const login = async (email) => {
    const user = await user_model_1.UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};
exports.login = login;
