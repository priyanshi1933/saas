import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { login, register, tenantSignup } from "../services/auth.service";
import { loginSchema, registerSchema, tenantSignupSchema, validateBody } from "../validation";

dotenv.config({ path: ".env.local" });

const secret = process.env.JWT_SECRET as string;

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = validateBody<{ email: string; password: string; role: string }>(
      registerSchema,
      req.body,
    );
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
    const { email, password, organizationName } = validateBody<{
      email: string;
      password: string;
      organizationName: string;
    }>(tenantSignupSchema, req.body);
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
    const { email, password } = validateBody<{ email: string; password: string }>(loginSchema, req.body);
    const user = await login(email);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ field: "password", message: "Password does not match" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, organizationId: user.organizationId },
      secret || "fallback_secret",
      { expiresIn: "1h" },
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
