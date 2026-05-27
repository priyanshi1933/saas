import { Types } from "mongoose";
import { UserModel } from "../models/user.model";
import { OrganizationModel } from "../models/organization.model";
import { InvitationModel } from "../models/invitation.model";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const normalizeInvitationRole = (role: string) => {
  const normalizedRole = role?.toLowerCase().replace(/[\s-]/g, "_");
  return normalizedRole === "readonly" ? "read_only" : normalizedRole;
};

export const register = async (
  email: string,
  password: string,
  role?: string,
) => {
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("Email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  return await UserModel.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "member",
  });
};

export const tenantSignup = async (
  email: string,
  password: string,
  organizationName: string,
) => {
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  const existingOrg = await OrganizationModel.findOne({ name: organizationName.trim() });
  if (existingOrg) {
    throw new Error("Organization already exists");
  }

  let organization = null;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const ownerId = new Types.ObjectId();

    organization = await OrganizationModel.create({
      name: organizationName.trim(),
      owner: ownerId,
      members: [ownerId],
    });

    const ownerUser = await UserModel.create({
      _id: ownerId,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "owner",
      organizationId: organization._id,
    });

    return { organization, user: ownerUser };
  } catch (error) {
    if (organization) {
      await OrganizationModel.findByIdAndDelete(organization._id);
    }
    throw error;
  }
};

export const createInvitation = async (
  inviterId: string,
  organizationId: string,
  email: string,
  role: string,
) => {
  const normalizedRole = normalizeInvitationRole(role);
  const allowedRoles = ["admin", "member", "read_only"];
  if (!allowedRoles.includes(normalizedRole)) {
    throw new Error("Invalid role for invitation");
  }

  const inviter = await UserModel.findById(inviterId);
  if (!inviter || !["owner", "admin"].includes(inviter.role)) {
    throw new Error("Only owners and admins can invite teammates");
  }
  if (String(inviter.organizationId) !== String(organizationId)) {
    throw new Error("Inviter does not belong to this organization");
  }

  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("This email is already registered");
  }

  const existingInvite = await InvitationModel.findOne({
    organizationId,
    email: email.toLowerCase(),
    status: "pending",
  });
  if (existingInvite) {
    throw new Error("An invitation is already pending for this email");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const invitation = await InvitationModel.create({
    organizationId,
    email: email.toLowerCase(),
    role: normalizedRole,
    token,
    invitedBy: inviterId,
  });

  return invitation;
};

export const getOrganizationInvitations = async (
  requesterId: string,
  organizationId: string,
) => {
  const requester = await UserModel.findById(requesterId);
  if (!requester || !["owner", "admin"].includes(requester.role)) {
    throw new Error("Only owners and admins can view invitations");
  }
  if (String(requester.organizationId) !== String(organizationId)) {
    throw new Error("User does not belong to this organization");
  }

  return await InvitationModel.find({ organizationId })
    .select("email role token status createdAt")
    .sort({ createdAt: -1 });
};

export const getOrganizationMembers = async (
  requesterId: string,
  organizationId: string,
) => {
  const requester = await UserModel.findById(requesterId);
  if (!requester || String(requester.organizationId) !== String(organizationId)) {
    throw new Error("User does not belong to this organization");
  }

  return await UserModel.find({ organizationId })
    .select("email role organizationId createdAt")
    .sort({ createdAt: -1 });
};

export const acceptInvitation = async (
  token: string,
  email: string,
  password: string,
) => {
  const invitation = await InvitationModel.findOne({
    token,
    status: "pending",
  });
  if (!invitation) {
    throw new Error("Invitation token is invalid or expired");
  }

  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("Invitation email does not match");
  }

  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("This email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    role: invitation.role,
    organizationId: invitation.organizationId,
  });

  await OrganizationModel.findByIdAndUpdate(invitation.organizationId, {
    $push: { members: user._id },
  });

  invitation.status = "accepted";
  await invitation.save();

  return user;
};

export const login = async (email: string) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const getUser = async () => {
  return await UserModel.find().select("-password");
};

export const getUserProfile = async (userId: string) => {
  return await UserModel.findById(userId).select("-password");
};

