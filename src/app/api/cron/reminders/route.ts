import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendFollowUpReminder } from "@/lib/email";

/**
 * GET /api/cron/reminders
 * Protected by Authorization: Bearer <CRON_SECRET>
 *
 * Finds all APPLIED applications where:
 *  - appliedAt is older than user.reminderDays days ago
 *  - no REMINDER_SENT event in the last reminderDays days
 *
 * Sends a follow-up reminder email and logs a REMINDER_SENT OutcomeEvent.
 *
 * Local dev: call manually with curl or browser.
 * Production (Vercel Cron): add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 9 * * *" }] }
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Find all users who have applied applications
  const users = await db.user.findMany({
    where: { applications: { some: { status: "APPLIED", appliedAt: { not: null } } } },
    include: {
      applications: {
        where: { status: "APPLIED", appliedAt: { not: null } },
        include: {
          job: { select: { id: true, title: true, company: true } },
          events: { where: { type: "REMINDER_SENT" }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const results: { userId: string; sent: number; skipped: number } = { userId: "batch", sent: 0, skipped: 0 };

  for (const user of users) {
    const cutoff = new Date(now.getTime() - user.reminderDays * 24 * 60 * 60 * 1000);

    for (const app of user.applications) {
      if (!app.appliedAt) continue;

      // Check if applied date is old enough
      if (app.appliedAt > cutoff) { results.skipped++; continue; }

      // Check last reminder wasn't sent within reminderDays
      const lastReminder = app.events[0];
      if (lastReminder && lastReminder.createdAt > cutoff) { results.skipped++; continue; }

      // Send reminder
      await sendFollowUpReminder({
        to: user.email,
        userName: user.name,
        jobTitle: app.job.title,
        company: app.job.company,
        appliedAt: app.appliedAt,
        applicationId: app.id,
        jobId: app.job.id,
      });

      // Log the reminder event
      await db.outcomeEvent.create({
        data: {
          applicationId: app.id,
          type: "REMINDER_SENT",
          fromStatus: "APPLIED",
          toStatus: "APPLIED",
        },
      });

      results.sent++;
    }
  }

  console.log(`[cron/reminders] Sent: ${results.sent}, Skipped: ${results.skipped}`);
  return NextResponse.json({ ok: true, sent: results.sent, skipped: results.skipped });
}
