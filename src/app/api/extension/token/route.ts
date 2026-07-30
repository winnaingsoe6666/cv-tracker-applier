import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { apiUserId } from "@/lib/session";

/** Generate a new extension API token for the current user. */
export async function POST() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = `cf_${randomBytes(32).toString("hex")}`;
  await db.user.update({ where: { id: userId }, data: { apiToken: token } });
  return NextResponse.json({ token });
}

/** Revoke (clear) the extension API token. */
export async function DELETE() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.user.update({ where: { id: userId }, data: { apiToken: null } });
  return NextResponse.json({ ok: true });
}
