import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(20, "Name cannot exceed 20 characters."),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((email) => email.toLowerCase()),

  password: z.string().min(8, "Password must contain at least 8 characters."),

  role: z.enum(["PROJECT_MANAGER", "TEAM_MEMBER"]),
});

export const updateRoleSchema = z.object({
  role: z.enum(["PROJECT_MANAGER", "TEAM_MEMBER"]),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});
