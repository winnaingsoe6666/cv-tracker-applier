import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/cron/job-alerts — daily cron to check saved searches for new matches.
 * Protected by Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const searches = await db.savedSearch.findMany({
    where: { active: true },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  let alerted = 0;
  for (const search of searches) {
    // Find jobs matching the search criteria since last notification
    const since = search.lastNotifiedAt ?? new Date(0);
    const where: Record<string, unknown> = {
      userId: search.user.id,
      createdAt: { gt: since },
    };
    if (search.market) where.market = search.market;
    if (search.seniority) where.seniority = search.seniority;
    if (search.query) where.title = { contains: search.query };

    const matchingJobs = await db.job.findMany({ where, select: { id: true, title: true, company: true } });

    if (matchingJobs.length > 0) {
      // Log to console (dev stub) — in production send email via Resend
      console.log(`[cron/job-alerts] ${search.user.email}: ${matchingJobs.length} new matches for "${search.label}"`);
      alerted++;
    }

    await db.savedSearch.update({
      where: { id: search.id },
      data: { lastNotifiedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, searches: searches.length, alerted });
}
