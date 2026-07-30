import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { MARKETS, STATUS_LABELS, PipelineStatus } from "@/lib/constants";
import { Badge, Card, CardTitle } from "@/components/ui";
import { WorkbenchClient } from "./workbench-client";
import type { MatchBreakdown } from "@/lib/scoring/match";
import type { AtsBreakdown } from "@/lib/scoring/ats";

export default async function JobWorkbenchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [job, resumes] = await Promise.all([
    db.job.findFirst({
      where: { id, userId: user.id },
      include: {
        applications: {
          include: { events: { orderBy: { createdAt: "desc" }, take: 5 } },
          take: 1,
        },
      },
    }),
    db.resume.findMany({
      where: { userId: user.id },
      orderBy: [{ isBase: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true, isBase: true },
    }),
  ]);

  if (!job) notFound();

  const application = job.applications[0] ?? null;
  const market = MARKETS.find((m) => m.value === job.market)?.label ?? job.market;

  // Load the latest match + ATS reports if they exist
  let lastMatchData: {
    matchScore: number;
    atsScore: number;
    matchBreakdown: MatchBreakdown;
    atsBreakdown: AtsBreakdown;
  } | null = null;

  if (application?.resumeId) {
    const [matchReport, atsReport] = await Promise.all([
      db.matchReport.findFirst({
        where: { jobId: id, resumeId: application.resumeId },
        orderBy: { createdAt: "desc" },
      }),
      db.atsReport.findFirst({
        where: { jobId: id, resumeId: application.resumeId },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    if (matchReport && atsReport) {
      lastMatchData = {
        matchScore: matchReport.score,
        atsScore: atsReport.score,
        matchBreakdown: JSON.parse(matchReport.breakdownJson) as MatchBreakdown,
        atsBreakdown: JSON.parse(atsReport.breakdownJson) as AtsBreakdown,
      };
    }
  }

  // Worthiness score
  const worthiness = job.worthinessJson
    ? (JSON.parse(job.worthinessJson) as {
        score: number;
        notes: { tone: "good" | "bad" | "neutral"; text: string }[];
      })
    : null;

  const statusTone: Record<string, "neutral" | "info" | "accent" | "warn" | "danger"> = {
    SAVED: "neutral",
    TAILORING: "info",
    READY: "info",
    APPLIED: "accent",
    SCREENING: "accent",
    INTERVIEW: "accent",
    OFFER: "accent",
    REJECTED: "danger",
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb + Studio shortcut */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/jobs" className="hover:text-foreground transition">Jobs</Link>
          <span>/</span>
          <span className="text-foreground">{job.title}</span>
        </div>
        <Link
          href={`/jobs/${id}/studio`}
          className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-accent"
        >
          Apply Studio →
        </Link>
      </div>

      {/* Job header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">{job.company}</span>
              {job.location && <span className="text-sm text-faint">· {job.location}</span>}
              <Badge tone="neutral">{market}</Badge>
              {job.seniority && (
                <Badge tone="info">{job.seniority[0] + job.seniority.slice(1).toLowerCase()}</Badge>
              )}
              {application && (
                <Badge tone={statusTone[application.status] ?? "neutral"}>
                  {STATUS_LABELS[application.status as PipelineStatus] ?? application.status}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-faint">
              {job.source && <span>via {job.source}</span>}
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  View original posting →
                </a>
              )}
              {job.salaryMin && (
                <span>
                  {job.currency ?? ""} {job.salaryMin.toLocaleString()}
                  {job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : "+"}
                </span>
              )}
              <span>Added {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {worthiness && (
            <WorthinessScore score={worthiness.score} notes={worthiness.notes} />
          )}
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Workbench (match engine) */}
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
              Match Workbench
            </h2>
            <p className="text-xs text-muted">
              Run the match engine to score this JD against your chosen resume — skills overlap,
              must-haves, seniority fit, location risk, and ATS parseability.
            </p>
          </div>
          {application ? (
            <WorkbenchClient
              jobId={job.id}
              resumes={resumes}
              application={{
                id: application.id,
                status: application.status,
                atsScoreSnapshot: application.atsScoreSnapshot,
                matchScoreSnapshot: application.matchScoreSnapshot,
                resumeId: application.resumeId,
              }}
              lastMatchData={lastMatchData}
              atsThreshold={user.gateAtsThreshold}
              matchThreshold={user.gateMatchThreshold}
            />
          ) : (
            <p className="text-sm text-muted">
              No application record found for this job. This is unexpected — try re-creating the job.
            </p>
          )}
        </div>

        {/* Right: Job description + pipeline history */}
        <div className="space-y-5">
          <Card>
            <CardTitle>Job Description</CardTitle>
            <div className="max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-muted">
                {job.description}
              </pre>
            </div>
          </Card>

          {application && application.events.length > 0 && (
            <Card>
              <CardTitle>Pipeline History</CardTitle>
              <div className="space-y-2">
                {application.events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 text-xs text-muted">
                    <span className="text-faint">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      {STATUS_LABELS[ev.fromStatus as PipelineStatus] ?? ev.fromStatus}
                      {" → "}
                      {STATUS_LABELS[ev.toStatus as PipelineStatus] ?? ev.toStatus}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {worthiness && worthiness.notes.length > 0 && (
            <Card>
              <CardTitle sub="Job quality signals">Worthiness Signals</CardTitle>
              <div className="space-y-2">
                {worthiness.notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 shrink-0 text-xs ${
                        note.tone === "good"
                          ? "text-accent"
                          : note.tone === "bad"
                            ? "text-danger"
                            : "text-warn"
                      }`}
                    >
                      {note.tone === "good" ? "✓" : note.tone === "bad" ? "✗" : "⚠"}
                    </span>
                    <p className="text-xs text-muted">{note.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Worthiness score badge ────────────────────────────────────────────────────

function WorthinessScore({
  score,
  notes,
}: {
  score: number;
  notes: { tone: "good" | "bad" | "neutral"; text: string }[];
}) {
  const color =
    score >= 70 ? "text-accent border-accent/30 bg-accent/5" : score >= 50 ? "text-warn border-warn/30 bg-warn/5" : "text-danger border-danger/30 bg-danger/5";
  const badCount = notes.filter((n) => n.tone === "bad").length;
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-xl border px-4 py-3 ${color}`}>
      <span className="text-2xl font-bold">{score}</span>
      <span className="text-[10px] font-semibold tracking-wide uppercase">Worthiness</span>
      {badCount > 0 && (
        <span className="text-[10px] text-faint">{badCount} flag{badCount > 1 ? "s" : ""}</span>
      )}
    </div>
  );
}
