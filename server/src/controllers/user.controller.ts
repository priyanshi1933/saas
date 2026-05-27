import { Request, Response } from "express";
import {
  getUser,
  getUserProfile,
  login,
  register,
  tenantSignup,
  createInvitation,
  acceptInvitation,
  getOrganizationInvitations,
  getOrganizationMembers,
} from "../services/user.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
console.log("Secret loaded:", process.env.JWT_SECRET);

const secret = process.env.JWT_SECRET as string;

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role = "member" } = req.body;
    const user = await register(email, password, role);
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { id: user._id, email: user.email },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const tenantSignupUser = async (req: Request, res: Response) => {
  try {
    const { email, password, organizationName } = req.body;
    const result = await tenantSignup(email, password, organizationName);
    const token = jwt.sign(
      {
        id: result.user._id,
        role: result.user.role,
        organizationId: result.user.organizationId,
      },
      secret || "fallback_secret",
      { expiresIn: "1h" },
    );

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: {
        userId: result.user._id,
        organizationId: result.organization._id,
        role: result.user.role,
        token,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await login(email);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ field: "password", message: "Password does not match" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, organizationId: user.organizationId },
      secret || "fallback_secret",
      {
        expiresIn: "1h",
      },
    );

    res.cookie("token", token);
    res.json({
      token,
      role: user.role,
      organizationId: user.organizationId,
      id: user._id,
    });
  } catch (error: any) {
    res.status(400).json({ field: "email", message: error.message });
  }
};

export const inviteUser = async (req: Request, res: Response) => {
  try {
    const inviter = (req as any).user;
    const { email, role } = req.body;
    if (!inviter || !inviter.organizationId) {
      return res.status(403).json({ message: "Organization context is required" });
    }

    const invitation = await createInvitation(inviter.id, inviter.organizationId, email, role);
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getInvitations = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.organizationId) {
      return res.status(403).json({ message: "Organization context is required" });
    }

    const invitations = await getOrganizationInvitations(requester.id, requester.organizationId);

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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.organizationId) {
      return res.status(403).json({ message: "Organization context is required" });
    }

    const members = await getOrganizationMembers(requester.id, requester.organizationId);

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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const acceptInvitationUser = async (req: Request, res: Response) => {
  try {
    const { token, email, password } = req.body;
    const user = await acceptInvitation(token, email, password);
    res.status(201).json({
      success: true,
      message: "Invitation accepted and user created",
      data: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserProfile(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUser();
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ message: "No User Available" });
  }
};
