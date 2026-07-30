import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { KanbanBoard } from "@/components/kanban-board";

export default async function PipelinePage() {
  const user = await requireUser();

  const applications = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: { id: true, title: true, company: true, market: true, location: true, url: true },
      },
    },
  });

  const total = applications.length;
  const applied = applications.filter((a) =>
    ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"].includes(a.status)
  ).length;
  const interviews = applications.filter((a) =>
    ["INTERVIEW", "OFFER"].includes(a.status)
  ).length;
  const offers = applications.filter((a) => a.status === "OFFER").length;
  const rejected = applications.filter((a) => a.status === "REJECTED").length;
  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : null;

  return (
    <div className="mx-auto max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-muted">
          Recruiter board — drag-free status transitions, score-aware.
        </p>
      </div>

      {/* Stats strip */}
      {total > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <StatChip label="Tracked" value={total} />
          <StatChip label="Applied" value={applied} />
          <StatChip label="Interviews" value={interviews} tone="warn" />
          <StatChip label="Offers" value={offers} tone="accent" />
          <StatChip label="Rejected" value={rejected} tone="danger" />
          {interviewRate !== null && (
            <StatChip label="Interview rate" value={`${interviewRate}%`} tone={interviewRate >= 20 ? "accent" : "warn"} />
          )}
        </div>
      )}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge-strong py-24 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-edge bg-surface2 text-xl text-faint">
            ◎
          </div>
          <p className="text-sm font-medium text-foreground">No applications yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted">
            Track a job and run the match engine — every application lands here so you can manage the full pipeline.
          </p>
          <a
            href="/jobs"
            className="mt-4 rounded-lg bg-accent-dim px-4 py-2 text-sm font-semibold text-[#06281c] transition hover:bg-accent"
          >
            Track a job
          </a>
        </div>
      ) : (
        <KanbanBoard
          applications={applications.map((a) => ({
            id: a.id,
            status: a.status,
            mode: a.mode,
            appliedAt: a.appliedAt?.toISOString() ?? null,
            matchScoreSnapshot: a.matchScoreSnapshot,
            atsScoreSnapshot: a.atsScoreSnapshot,
            job: a.job,
          }))}
        />
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "accent" | "warn" | "danger";
}) {
  const toneMap = {
    neutral: "text-foreground border-edge bg-surface",
    accent: "text-accent border-accent/30 bg-accent/5",
    warn: "text-warn border-warn/30 bg-warn/5",
    danger: "text-danger border-danger/30 bg-danger/5",
  };
  return (
    <div className={`flex flex-col items-center rounded-xl border px-4 py-2.5 ${toneMap[tone]}`}>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-[10px] font-medium tracking-wide text-faint uppercase">{label}</span>
    </div>
  );
}
