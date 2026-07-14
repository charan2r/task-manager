import { z } from "zod";

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .optional()
  .nullable();

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Project name must contain at least 3 characters.")
      .max(50, "Project name cannot exceed 50 characters."),

    description: z
      .string()
      .trim()
      .max(100, "Description cannot exceed 100 characters.")
      .optional()
      .nullable(),

    status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),

    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: "End date must be on or after the start date.",
      path: ["endDate"],
    },
  );

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Project name must contain at least 3 characters.")
      .max(50, "Project name cannot exceed 50 characters.")
      .optional(),

    description: z.string().trim().max(100).optional().nullable(),

    status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),

    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: "End date must be on or after the start date.",
      path: ["endDate"],
    },
  );

export const assignProjectMemberSchema = z.object({
  userId: z.coerce
    .number()
    .int("User ID must be an integer.")
    .positive("User ID must be positive."),
});
