import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

export async function GET() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const searches = await db.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(searches);
}

export async function POST(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!label || !query) return NextResponse.json({ error: "label and query required" }, { status: 400 });

  const search = await db.savedSearch.create({
    data: {
      userId,
      label,
      query,
      market: body.market ?? null,
      seniority: body.seniority ?? null,
      minSalary: typeof body.minSalary === "number" ? body.minSalary : null,
    },
  });
  return NextResponse.json(search);
}

export async function DELETE(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.savedSearch.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
