import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

export async function GET() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await db.collaboration.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(owned);
}

export async function POST(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = ["VIEWER", "EDITOR"].includes(body?.role) ? body.role : "VIEWER";
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const existing = await db.collaboration.findFirst({ where: { ownerId: userId, collaboratorEmail: email } });
  if (existing) return NextResponse.json({ error: "Already invited" }, { status: 409 });

  const collab = await db.collaboration.create({ data: { ownerId: userId, collaboratorEmail: email, role } });
  return NextResponse.json(collab);
}

export async function DELETE(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.collaboration.deleteMany({ where: { id, ownerId: userId } });
  return NextResponse.json({ ok: true });
}
