import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  // Rate limit: 3 registrations per hour per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.register.max, RATE_LIMITS.register.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid name, email and a password of at least 8 characters." }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { name, email: email.toLowerCase(), passwordHash },
  });
  return NextResponse.json({ ok: true });
}
