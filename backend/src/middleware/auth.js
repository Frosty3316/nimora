import { publicUser, verifyToken } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: { message: "Authentication required." } });
    }
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: { message: "User no longer exists." } });
    }
    req.user = publicUser(user);
    next();
  } catch {
    return res.status(401).json({ error: { message: "Invalid or expired token." } });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: { message: "Admin access required." } });
  }
  next();
}
