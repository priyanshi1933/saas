"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvitationUser = exports.getTeamMembers = exports.getInvitations = exports.inviteUser = void 0;
const invitation_service_1 = require("../services/invitation.service");
const validation_1 = require("../validation");
const inviteUser = async (req, res) => {
    try {
        const inviter = req.user;
        const { email, role } = (0, validation_1.validateBody)(validation_1.inviteSchema, req.body);
        if (!inviter || !inviter.organizationId) {
            return res.status(403).json({ message: "Organization context is required" });
        }
        const invitation = await (0, invitation_service_1.createInvitation)(inviter.id, inviter.organizationId, email, role);
        const inviteLink = `${req.protocol}://${req.get("host")}/invite/accept?token=${invitation.token}`;
        res.status(201).json({
            success: true,
            message: "Invitation created successfully",
            data: {
                email: invitation.email,
                role: invitation.role,
                token: invitation.token,
                inviteLink,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.inviteUser = inviteUser;
const getInvitations = async (req, res) => {
    try {
        const requester = req.user;
        if (!requester || !requester.organizationId) {
            return res.status(403).json({ message: "Organization context is required" });
        }
        const invitations = await (0, invitation_service_1.getOrganizationInvitations)(requester.id, requester.organizationId);
        res.json({
            success: true,
            data: invitations.map((invitation) => ({
                id: invitation._id,
                email: invitation.email,
                role: invitation.role,
                token: invitation.token,
                status: invitation.status,
                createdAt: invitation.createdAt,
            })),
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getInvitations = getInvitations;
const getTeamMembers = async (req, res) => {
    try {
        const requester = req.user;
        if (!requester || !requester.organizationId) {
            return res.status(403).json({ message: "Organization context is required" });
        }
        const members = await (0, invitation_service_1.getOrganizationMembers)(requester.id, requester.organizationId);
        res.json({
            success: true,
            data: members.map((member) => ({
                id: member._id,
                email: member.email,
                role: member.role,
                organizationId: member.organizationId,
                createdAt: member.createdAt,
            })),
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getTeamMembers = getTeamMembers;
const acceptInvitationUser = async (req, res) => {
    try {
        const { token, email, password } = (0, validation_1.validateBody)(validation_1.acceptInvitationSchema, req.body);
        const user = await (0, invitation_service_1.acceptInvitation)(token, email, password);
        res.status(201).json({
            success: true,
            message: "Invitation accepted and user created",
            data: { id: user._id, email: user.email, role: user.role },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.acceptInvitationUser = acceptInvitationUser;
