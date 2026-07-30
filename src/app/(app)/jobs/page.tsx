import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { MARKETS, STATUS_LABELS, PipelineStatus, PLANS, Plan } from "@/lib/constants";
import { Badge, EmptyState, scoreTone } from "@/components/ui";
import { JobForm } from "@/components/job-form";
import { UpgradeBanner } from "@/components/upgrade-banner";

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

export default async function JobsPage() {
  const user = await requireUser();
  const jobs = await db.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { applications: true },
  });
  const jobLimit = PLANS[(user.plan as Plan) ?? "FREE"].maxJobs;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Every job gets a match report before it earns an application.</p>
        </div>
      </div>

      <JobForm />

      <UpgradeBanner resource="jobs" used={jobs.length} limit={jobLimit} />

      <div className="mt-6 space-y-3">
        {jobs.length === 0 && (
          <EmptyState
            title="No jobs tracked yet"
            hint="Paste a job description from LinkedIn, JobStreet, JobsDB or any careers page. The engine scores fit before you spend time applying."
          />
        )}
        {jobs.map((job) => {
          const app = job.applications[0];
          const market = MARKETS.find((m) => m.value === job.market)?.label ?? job.market;
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-surface p-5 transition hover:border-accent/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{job.title}</p>
                  <span className="text-sm text-muted">· {job.company}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{market}</Badge>
                  {app && <Badge tone={statusTone[app.status] ?? "neutral"}>{STATUS_LABELS[app.status as PipelineStatus] ?? app.status}</Badge>}
                  {job.source && <span className="text-[11px] text-faint">{job.source}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-5 text-center">
                <MiniScore label="Match" value={app?.matchScoreSnapshot ?? null} />
                <MiniScore label="ATS" value={app?.atsScoreSnapshot ?? null} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number | null }) {
  const color = value === null ? "text-faint" : { accent: "text-accent", warn: "text-warn", danger: "text-danger" }[scoreTone(value)];
  return (
    <div>
      <p className={`text-lg font-bold ${color}`}>{value ?? "—"}</p>
      <p className="text-[10px] font-medium tracking-wide text-faint uppercase">{label}</p>
    </div>
  );
}
