import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";
import { llmEnabled, recruiterCritique } from "@/lib/llm";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!llmEnabled()) {
    return NextResponse.json(
      { error: "LLM enrichment is not configured. Add OPENAI_API_KEY to .env to enable recruiter critique." },
      { status: 501 }
    );
  }
  const { id } = await params;
  const resume = await db.resume.findFirst({ where: { id, userId } });
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const critique = await recruiterCritique(resume.rawText);
  if (!critique) return NextResponse.json({ error: "Critique service unavailable right now." }, { status: 502 });
  return NextResponse.json({ critique });
}
