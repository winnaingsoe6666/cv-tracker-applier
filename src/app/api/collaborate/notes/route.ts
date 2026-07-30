import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("applicationId");
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const notes = await db.collabNote.findMany({
    where: { applicationId },
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const applicationId = typeof body?.applicationId === "string" ? body.applicationId : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!applicationId || !content) return NextResponse.json({ error: "applicationId and content required" }, { status: 400 });

  const note = await db.collabNote.create({
    data: { applicationId, authorId: userId, content },
    include: { author: { select: { name: true, email: true } } },
  });
  return NextResponse.json(note);
}
