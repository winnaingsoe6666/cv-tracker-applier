import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

/** Fetch the latest MatchReport + AtsReport for a job+resume pair. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const resumeId = searchParams.get("resumeId") ?? undefined;

  const job = await db.job.findFirst({ where: { id, userId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [matchReport, atsReport] = await Promise.all([
    db.matchReport.findFirst({
      where: { jobId: id, ...(resumeId ? { resumeId } : {}) },
      orderBy: { createdAt: "desc" },
    }),
    db.atsReport.findFirst({
      where: { jobId: id, ...(resumeId ? { resumeId } : {}) },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!matchReport || !atsReport) {
    return NextResponse.json({ error: "No report found" }, { status: 404 });
  }

  return NextResponse.json({
    matchReportId: matchReport.id,
    matchScore: matchReport.score,
    atsScore: atsReport.score,
    matchBreakdown: JSON.parse(matchReport.breakdownJson),
    atsBreakdown: JSON.parse(atsReport.breakdownJson),
  });
}
