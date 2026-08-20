import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, publicUser } from "../lib/auth.js";
import { createUserSchema } from "../lib/validators.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
    res.json({ users: users.map(publicUser) });
  })
);

usersRouter.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: { message: "An account with that email already exists." } });
    }
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: await hashPassword(data.password),
        role: data.role,
      },
    });
    res.status(201).json({ user: publicUser(user) });
  })
);
