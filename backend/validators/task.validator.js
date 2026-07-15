import { z } from "zod";

const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE"];

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Task title must contain at least 4 characters.")
    .max(150, "Task title cannot exceed 150 characters."),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .optional()
    .nullable(),

  projectId: z.coerce
    .number()
    .int("Project ID must be an integer.")
    .positive("Project ID must be positive."),

  assignedToId: z.coerce
    .number()
    .int("Assigned user ID must be an integer.")
    .positive("Assigned user ID must be positive.")
    .optional()
    .nullable(),

  status: z.enum(taskStatusValues).optional(),

  dueDate: optionalDate,
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Task title must contain at least 4 characters.")
      .max(150, "Task title cannot exceed 150 characters.")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters.")
      .optional()
      .nullable(),

    assignedToId: z.coerce
      .number()
      .int("Assigned user ID must be an integer.")
      .positive("Assigned user ID must be positive.")
      .optional()
      .nullable(),

    status: z.enum(taskStatusValues).optional(),

    dueDate: optionalDate,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

export const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatusValues),
});
