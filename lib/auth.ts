import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { readAuth } from "./storage";
import type { SessionPayload } from "./types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);
const COOKIE_NAME = "ft_session";

export async function verifyPassword(
  email: string,
  password: string
): Promise<SessionPayload | null> {
  const { users } = await readAuth();
  const u = users.find((x) => x.email === email);
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  return { email: u.email, memberId: u.memberId, role: u.role };
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = cookies().get(COOKIE_NAME);
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c.value, SECRET);
    return {
      email: payload.email as string,
      memberId: (payload.memberId as string) ?? null,
      role: (payload.role as "admin" | "user") ?? "user",
    };
  } catch {
    return null;
  }
}
