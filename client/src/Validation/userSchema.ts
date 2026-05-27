import { z } from "zod";

export const userSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  email: z.string().email("Please enter valid email format"),
  password: z.string().min(6, "Password contain minimum of 6 characters"),
});
