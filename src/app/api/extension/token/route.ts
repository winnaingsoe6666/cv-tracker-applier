import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { apiUserId } from "@/lib/session";
import { hashToken } from "@/lib/crypto";

/** Generate a new extension API token for the current user. */
export async function POST() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawToken = `cf_${randomBytes(32).toString("hex")}`;
  const hashedToken = hashToken(rawToken);
  await db.user.update({ where: { id: userId }, data: { apiToken: hashedToken } });
  // Return raw token only here — it won't be stored in plain text
  return NextResponse.json({ token: rawToken });
}

/** Revoke (clear) the extension API token. */
export async function DELETE() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.user.update({ where: { id: userId }, data: { apiToken: null } });
  return NextResponse.json({ ok: true });
}
