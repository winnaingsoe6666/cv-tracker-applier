import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";
import { parseResumeText, ParsedResume } from "@/lib/parse";
import { generateLetter } from "@/lib/letters";
import { polishLetter, llmEnabled } from "@/lib/llm";
import { PLANS, Plan } from "@/lib/constants";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { MatchBreakdown } from "@/lib/scoring/match";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit check
  const letterLimit = user.plan === "PRO" ? RATE_LIMITS.letter.pro : RATE_LIMITS.letter.free;
  const rl = checkRateLimit(`${userId}:letter`, letterLimit, RATE_LIMITS.letter.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Upgrade to Pro for higher limits." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": String(rl.resetAt) } }
    );
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const limit = PLANS[(user.plan as Plan) ?? "FREE"].maxLettersPerMonth;
  const used = await db.coverLetter.count({ where: { userId, createdAt: { gte: monthStart } } });
  if (used >= limit) {
    return NextResponse.json(
      { error: `Your ${user.plan} plan allows ${limit} generated letters per month. Upgrade to Pro in Settings.` },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const template = ["DIRECT", "NARRATIVE", "TECHNICAL"].includes(body?.template) ? body.template : "DIRECT";
  const resumeId = body?.resumeId ? String(body.resumeId) : null;

  const job = await db.job.findFirst({ where: { id, userId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resume = resumeId ? await db.resume.findFirst({ where: { id: resumeId, userId } }) : null;
  let parsed: ParsedResume | null = null;
  if (resume) {
    try {
      parsed = JSON.parse(resume.parsedJson) as ParsedResume;
    } catch {
      parsed = parseResumeText(resume.rawText);
    }
  }

  const latestMatch = resume
    ? await db.matchReport.findFirst({
        where: { jobId: job.id, resumeId: resume.id },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const matchedSkills = latestMatch
    ? (JSON.parse(latestMatch.breakdownJson) as MatchBreakdown).matchedSkills
    : [];

  let content = generateLetter(template, {
    userName: user.name,
    headline: user.headline,
    parsed: parsed ?? parseResumeText(""),
    job,
    matchedSkills,
  });

  let polished = false;
  if (resume && llmEnabled()) {
    const better = await polishLetter(content, resume.rawText, job.description);
    if (better) {
      content = better;
      polished = true;
    }
  }

  const letter = await db.coverLetter.create({
    data: { userId, jobId: job.id, resumeId: resume?.id ?? null, template, content },
  });

  return NextResponse.json({ id: letter.id, content, polished });
}
