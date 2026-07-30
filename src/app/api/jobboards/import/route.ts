import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";
import { scoreWorthiness } from "@/lib/scoring/worthiness";
import { PLANS, Plan } from "@/lib/constants";

const schema = z.object({
  source: z.enum(["linkedin", "jobstreet", "other"]),
  sourceId: z.string().min(1),
  title: z.string().min(2).max(120),
  company: z.string().min(1).max(120),
  location: z.string().max(120).optional().nullable(),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  description: z.string().min(40),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  currency: z.string().max(8).optional().nullable(),
  seniority: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD"]).optional().nullable(),
  market: z.enum(["TH", "MY", "SG", "REMOTE", "OTHER"]).default("OTHER"),
});

export async function POST(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = PLANS[(user.plan as Plan) ?? "FREE"].maxJobs;
  const count = await db.job.count({ where: { userId } });
  if (count >= limit) {
    return NextResponse.json(
      { error: `Your ${user.plan} plan allows ${limit} tracked jobs. Upgrade to Pro in Settings for more.` },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid job data." }, { status: 400 });
  }
  const data = parsed.data;
  const worthiness = scoreWorthiness(data);

  const job = await db.job.create({
    data: {
      userId,
      title: data.title,
      company: data.company,
      location: data.location || null,
      market: data.market,
      url: data.url || null,
      source: data.source,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      currency: data.currency || null,
      seniority: data.seniority ?? null,
      description: data.description,
      worthinessJson: JSON.stringify(worthiness),
      applications: { create: { userId, status: "SAVED", mode: "ASSISTED" } },
    },
  });

  return NextResponse.json({ id: job.id, message: "Imported from " + data.source });
}
