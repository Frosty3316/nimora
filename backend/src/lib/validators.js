import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const createUserSchema = registerSchema.extend({
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name is required."),
  description: z.string().trim().optional().default(""),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid("Select a valid team member."),
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2, "Task title is required."),
  description: z.string().trim().optional().default(""),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional().default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  deadline: z.string().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  deadline: z.string().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty."),
});
