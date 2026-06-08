"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvitation = exports.getOrganizationMembers = exports.getOrganizationInvitations = exports.createInvitation = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const invitation_model_1 = require("../models/invitation.model");
const organization_model_1 = require("../models/organization.model");
const user_model_1 = require("../models/user.model");
const normalizeInvitationRole = (role) => {
    const normalizedRole = role?.toLowerCase().replace(/[\s-]/g, "_");
    return normalizedRole === "readonly" ? "read_only" : normalizedRole;
};
const createInvitation = async (inviterId, organizationId, email, role) => {
    const normalizedRole = normalizeInvitationRole(role);
    const allowedRoles = ["admin", "member", "read_only"];
    if (!allowedRoles.includes(normalizedRole)) {
        throw new Error("Invalid role for invitation");
    }
    const inviter = await user_model_1.UserModel.findById(inviterId);
    if (!inviter || !["owner", "admin"].includes(inviter.role)) {
        throw new Error("Only owners and admins can invite teammates");
    }
    if (String(inviter.organizationId) !== String(organizationId)) {
        throw new Error("Inviter does not belong to this organization");
    }
    const existingUser = await user_model_1.UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new Error("This email is already registered");
    }
    const existingInvite = await invitation_model_1.InvitationModel.findOne({
        organizationId,
        email: email.toLowerCase(),
        status: "pending",
    });
    if (existingInvite) {
        throw new Error("An invitation is already pending for this email");
    }
    const token = crypto_1.default.randomBytes(24).toString("hex");
    return await invitation_model_1.InvitationModel.create({
        organizationId,
        email: email.toLowerCase(),
        role: normalizedRole,
        token,
        invitedBy: inviterId,
    });
};
exports.createInvitation = createInvitation;
const getOrganizationInvitations = async (requesterId, organizationId) => {
    const requester = await user_model_1.UserModel.findById(requesterId);
    if (!requester || !["owner", "admin"].includes(requester.role)) {
        throw new Error("Only owners and admins can view invitations");
    }
    if (String(requester.organizationId) !== String(organizationId)) {
        throw new Error("User does not belong to this organization");
    }
    return await invitation_model_1.InvitationModel.find({ organizationId })
        .select("email role token status createdAt")
        .sort({ createdAt: -1 });
};
exports.getOrganizationInvitations = getOrganizationInvitations;
const getOrganizationMembers = async (requesterId, organizationId) => {
    const requester = await user_model_1.UserModel.findById(requesterId);
    if (!requester || String(requester.organizationId) !== String(organizationId)) {
        throw new Error("User does not belong to this organization");
    }
    return await user_model_1.UserModel.find({ organizationId })
        .select("email role organizationId createdAt")
        .sort({ createdAt: -1 });
};
exports.getOrganizationMembers = getOrganizationMembers;
const acceptInvitation = async (token, email, password) => {
    const invitation = await invitation_model_1.InvitationModel.findOne({
        token,
        status: "pending",
    });
    if (!invitation) {
        throw new Error("Invitation token is invalid or expired");
    }
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        throw new Error("Invitation email does not match");
    }
    const existingUser = await user_model_1.UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new Error("This email is already registered");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await user_model_1.UserModel.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        role: invitation.role,
        organizationId: invitation.organizationId,
    });
    await organization_model_1.OrganizationModel.findByIdAndUpdate(invitation.organizationId, {
        $push: { members: user._id },
    });
    invitation.status = "accepted";
    await invitation.save();
    return user;
};
exports.acceptInvitation = acceptInvitation;
