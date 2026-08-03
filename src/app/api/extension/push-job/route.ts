import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoreWorthiness } from "@/lib/scoring/worthiness";
import { MARKETS, SENIORITIES } from "@/lib/constants";
import { hashToken } from "@/lib/crypto";

/** Helper — validate Bearer token and return userId or null. */
async function resolveExtensionUser(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const rawToken = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!rawToken) return null;
  const hashedToken = hashToken(rawToken);
  const user = await db.user.findUnique({ where: { apiToken: hashedToken }, select: { id: true } });
  return user?.id ?? null;
}

/**
 * POST /api/extension/push-job
 * Body: { title, company, description, url?, location?, market?, source? }
 * Auth: Bearer <apiToken>
 */
export async function POST(req: Request) {
  const userId = await resolveExtensionUser(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Invalid or missing API token. Generate one in CareerForge → Settings → Extension." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const title = String(body.title ?? "").trim();
  const company = String(body.company ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title || !company || description.length < 50) {
    return NextResponse.json(
      { error: "title, company, and description (min 50 chars) are required." },
      { status: 422 }
    );
  }

  // Resolve market + seniority (auto-detect if not provided)
  const market = MARKETS.map((m) => m.value).includes(body.market) ? body.market : "OTHER";
  const seniority = SENIORITIES.includes(body.seniority) ? body.seniority : null;

  // Worthiness score
  let worthinessJson: string | null = null;
  try {
    const w = scoreWorthiness({ description, url: body.url ? String(body.url) : undefined });
    worthinessJson = JSON.stringify(w);
  } catch {
    // non-blocking
  }

  // Create job + application in one transaction
  const job = await db.job.create({
    data: {
      userId,
      title,
      company,
      description,
      url: body.url ? String(body.url) : null,
      location: body.location ? String(body.location) : null,
      market,
      seniority,
      source: body.source ? String(body.source) : "extension",
      worthinessJson,
      applications: {
        create: {
          userId,
          status: "SAVED",
          mode: "SEMI_AUTO",
          events: { create: { fromStatus: "SAVED", toStatus: "SAVED" } },
        },
      },
    },
    include: { applications: true },
  });

  return NextResponse.json({
    jobId: job.id,
    applicationId: job.applications[0]?.id,
    workbenchUrl: `/jobs/${job.id}`,
    worthiness: worthinessJson ? JSON.parse(worthinessJson).score : null,
  });
}
