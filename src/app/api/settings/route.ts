import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  headline: z.string().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  linkedin: z.string().max(200).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  gateAtsThreshold: z.number().int().min(0).max(100).optional(),
  gateMatchThreshold: z.number().int().min(0).max(100).optional(),
  reminderDays: z.number().int().min(1).max(30).optional(),
});

export async function PATCH(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data." }, { status: 400 });
  }

  const data = parsed.data;
  await db.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.headline !== undefined ? { headline: data.headline } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.linkedin !== undefined ? { linkedin: data.linkedin } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.gateAtsThreshold !== undefined ? { gateAtsThreshold: data.gateAtsThreshold } : {}),
      ...(data.gateMatchThreshold !== undefined ? { gateMatchThreshold: data.gateMatchThreshold } : {}),
      ...(data.reminderDays !== undefined ? { reminderDays: data.reminderDays } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
