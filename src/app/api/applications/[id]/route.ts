import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";
import { PIPELINE_STATUSES } from "@/lib/constants";

const schema = z.object({
  status: z.enum(PIPELINE_STATUSES).optional(),
  mode: z.enum(["ASSISTED", "SEMI"]).optional(),
  notes: z.string().max(4000).optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  gateOverride: z.boolean().optional(), // explicit user confirmation to apply below thresholds
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { status, mode, notes, checklist, gateOverride } = parsed.data;

  const app = await db.application.findFirst({ where: { id, userId } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Quality gate: moving to APPLIED requires passing thresholds or an explicit override.
  if (status === "APPLIED" && app.status !== "APPLIED") {
    const user = await db.user.findUnique({ where: { id: userId } });
    const atsOk = (app.atsScoreSnapshot ?? 0) >= (user?.gateAtsThreshold ?? 75);
    const matchOk = (app.matchScoreSnapshot ?? 0) >= (user?.gateMatchThreshold ?? 70);
    const analyzed = app.atsScoreSnapshot !== null && app.matchScoreSnapshot !== null;
    if ((!analyzed || !atsOk || !matchOk) && !gateOverride) {
      return NextResponse.json(
        {
          error: !analyzed
            ? "Run the match analysis before marking as applied — never send an unscored application."
            : "This application is below your quality gate thresholds. Improve the resume or confirm the override.",
          gateBlocked: true,
        },
        { status: 409 }
      );
    }
  }

  const updated = await db.application.update({
    where: { id },
    data: {
      ...(status ? { status, ...(status === "APPLIED" && app.status !== "APPLIED" ? { appliedAt: new Date() } : {}) } : {}),
      ...(mode ? { mode } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(checklist ? { checklistJson: JSON.stringify(checklist) } : {}),
    },
  });

  if (status && status !== app.status) {
    await db.outcomeEvent.create({
      data: { applicationId: app.id, fromStatus: app.status, toStatus: status },
    });
  }

  return NextResponse.json({ ok: true, status: updated.status });
}
