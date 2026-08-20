import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  comparePassword,
  hashPassword,
  publicUser,
  signToken,
} from "../lib/auth.js";
import { loginSchema, registerSchema } from "../lib/validators.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: { message: "An account with that email already exists." } });
    }
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: await hashPassword(data.password),
        role: "MEMBER",
      },
    });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await comparePassword(data.password, user.password))) {
      return res.status(401).json({ error: { message: "Invalid email or password." } });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);
