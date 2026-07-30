import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";

/**
 * POST /api/share
 * Body: { matchReportId: string }
 * Creates a ShareToken for a match report, valid for 30 days.
 * Returns { url: "/report/<token>" }
 */
export async function POST(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const matchReportId = typeof body?.matchReportId === "string" ? body.matchReportId : null;
  if (!matchReportId) {
    return NextResponse.json({ error: "matchReportId is required." }, { status: 422 });
  }

  // Verify the match report belongs to this user (via job ownership)
  const report = await db.matchReport.findFirst({
    where: { id: matchReportId, job: { userId } },
  });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  // Reuse existing token if one exists and is not expired
  const existing = await db.shareToken.findFirst({
    where: {
      userId,
      refId: matchReportId,
      type: "MATCH_REPORT",
      expiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    return NextResponse.json({ token: existing.token, url: `/report/${existing.token}` });
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const shareToken = await db.shareToken.create({
    data: { userId, type: "MATCH_REPORT", refId: matchReportId, expiresAt },
  });

  return NextResponse.json({ token: shareToken.token, url: `/report/${shareToken.token}` });
}
