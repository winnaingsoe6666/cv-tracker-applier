import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

const ROLE_FAMILIES = ["BACKEND", "FULLSTACK", "DATA", "DEVOPS", "MOBILE", "OTHER"] as const;

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const resume = await db.resume.findFirst({ where: { id, userId } });
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.resume.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

/** PATCH /api/resumes/[id] — update roleFamily and/or title */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const resume = await db.resume.findFirst({ where: { id, userId } });
  if (!resume) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data: { roleFamily?: string | null; title?: string } = {};
  if ("roleFamily" in body) {
    const rf = body.roleFamily;
    data.roleFamily =
      rf === null ? null : (ROLE_FAMILIES as readonly string[]).includes(rf) ? rf : resume.roleFamily;
  }
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }

  const updated = await db.resume.update({ where: { id }, data });
  return NextResponse.json({ ok: true, roleFamily: updated.roleFamily, title: updated.title });
}
