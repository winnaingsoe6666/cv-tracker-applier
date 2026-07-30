import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "");
  if (!content.trim()) return NextResponse.json({ error: "Letter content cannot be empty." }, { status: 400 });
  const letter = await db.coverLetter.findFirst({ where: { id, userId } });
  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.coverLetter.update({ where: { id }, data: { content } });
  return NextResponse.json({ ok: true });
}
