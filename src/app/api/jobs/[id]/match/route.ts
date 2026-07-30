import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";
import { parseResumeText, ParsedResume } from "@/lib/parse";
import { scoreMatch } from "@/lib/scoring/match";
import { scoreAts } from "@/lib/scoring/ats";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/** Run (or re-run) the full analysis of a resume against this job:
 *  JD match report + JD-aware ATS report, and snapshot scores on the application. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit check
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const limit = user?.plan === "PRO" ? RATE_LIMITS.match.pro : RATE_LIMITS.match.free;
  const rl = checkRateLimit(`${userId}:match`, limit, RATE_LIMITS.match.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Upgrade to Pro for higher limits." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": String(rl.resetAt) } }
    );
  }

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const resumeId = String(body?.resumeId ?? "");
  if (!resumeId) return NextResponse.json({ error: "resumeId is required." }, { status: 400 });

  const [job, resume] = await Promise.all([
    db.job.findFirst({ where: { id, userId } }),
    db.resume.findFirst({ where: { id: resumeId, userId } }),
  ]);
  if (!job || !resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let parsed: ParsedResume;
  try {
    parsed = JSON.parse(resume.parsedJson) as ParsedResume;
  } catch {
    parsed = parseResumeText(resume.rawText);
  }

  const match = scoreMatch(parsed, resume.rawText, job);
  const ats = scoreAts(parsed, resume.rawText, job.description);

  await db.$transaction([
    db.matchReport.create({
      data: { jobId: job.id, resumeId: resume.id, score: match.score, breakdownJson: JSON.stringify(match.breakdown) },
    }),
    db.atsReport.create({
      data: { resumeId: resume.id, jobId: job.id, score: ats.score, breakdownJson: JSON.stringify(ats.breakdown) },
    }),
    db.application.update({
      where: { jobId: job.id },
      data: { resumeId: resume.id, matchScoreSnapshot: match.score, atsScoreSnapshot: ats.score },
    }),
  ]);

  return NextResponse.json({ matchScore: match.score, atsScore: ats.score });
}
