import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const job = await db.job.findFirst({ where: { id, userId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
