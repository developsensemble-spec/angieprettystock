import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./lib-prisma";
import type { Role } from "@prisma/client";

const COOKIE = "ap_session";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET doit contenir au moins 32 caractères.");
  return value;
}
function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export async function createSession(userId: string) {
  const jar = await cookies();
  const payload = `${userId}.${Date.now() + 1000 * 60 * 60 * 12}`;
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 12
  });
}
export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, signature] = parts;
  const payload = `${userId}.${expiry}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b) || Number(expiry) < Date.now()) return null;
  return prisma.user.findFirst({ where: { id: userId, active: true }, select: { id: true, name: true, email: true, role: true } });
}
export async function requireRoles(roles: Role[]) {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
export function canSeeAllOrders(role: Role) {
  return ["ADMIN", "MANAGER", "BILLING", "WAREHOUSE", "DISPATCH_TANA", "DISPATCH_PROVINCE", "FEEDBACK_TANA", "FEEDBACK_PROVINCE"].includes(role);
}
