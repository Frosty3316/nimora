import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 16)) {
    throw new Error("JWT_SECRET must be a long random value in production.");
  }
  return secret || "nimora-dev-secret-local-only";
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret());
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
