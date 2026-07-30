"use client";

import { useState, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PIPELINE_STATUSES, STATUS_LABELS, PipelineStatus } from "@/lib/constants";

interface Application {
  id: string;
  status: string;
  mode: string;
  appliedAt: string | null;
  matchScoreSnapshot: number | null;
  atsScoreSnapshot: number | null;
  job: {
    id: string;
    title: string;
    company: string;
    market: string;
    location: string | null;
    url: string | null;
  };
}

interface KanbanBoardProps {
  applications: Application[];
}

// Columns we show on the board (all 8 statuses)
const COLUMNS = PIPELINE_STATUSES;

const columnTone: Record<PipelineStatus, { header: string; card: string; dot: string }> = {
  SAVED: {
    header: "text-faint border-edge",
    card: "border-edge",
    dot: "bg-faint",
  },
  TAILORING: {
    header: "text-info border-info/30",
    card: "border-info/20",
    dot: "bg-info",
  },
  READY: {
    header: "text-accent border-accent/30",
    card: "border-accent/20",
    dot: "bg-accent",
  },
  APPLIED: {
    header: "text-accent border-accent/30",
    card: "border-accent/20",
    dot: "bg-accent",
  },
  SCREENING: {
    header: "text-info border-info/30",
    card: "border-info/20",
    dot: "bg-info",
  },
  INTERVIEW: {
    header: "text-warn border-warn/30",
    card: "border-warn/20",
    dot: "bg-warn",
  },
  OFFER: {
    header: "text-accent border-accent/40",
    card: "border-accent/30",
    dot: "bg-accent",
  },
  REJECTED: {
    header: "text-danger border-danger/30",
    card: "border-danger/20",
    dot: "bg-danger",
  },
};

export function KanbanBoard({ applications: initialApps }: KanbanBoardProps) {
  const router = useRouter();
  const [apps, setApps] = useState(initialApps);
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byStatus = COLUMNS.reduce<Record<string, Application[]>>((acc, status) => {
    acc[status] = apps.filter((a) => a.status === status);
    return acc;
  }, {});

  async function moveApp(appId: string, toStatus: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app || app.status === toStatus) return;

    // Optimistic update
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: toStatus } : a))
    );
    setMoving(appId);
    setError(null);

    const res = await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStatus }),
    });
    setMoving(null);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      // Revert
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: app.status } : a))
      );
      setError(d.error ?? "Could not move application.");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      {/* Scrollable kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: `${COLUMNS.length * 220}px` }}>
          {COLUMNS.map((status) => {
            const tone = columnTone[status as PipelineStatus];
            const colApps = byStatus[status] ?? [];
            return (
              <div key={status} className="flex w-52 shrink-0 flex-col gap-2">
                {/* Column header */}
                <div
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${tone.header}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                    <span className="text-[11px] font-semibold tracking-wide uppercase">
                      {STATUS_LABELS[status as PipelineStatus]}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium opacity-60">{colApps.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {colApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      tone={tone}
                      moving={moving === app.id}
                      onMove={moveApp}
                    />
                  ))}
                  {colApps.length === 0 && (
                    <div className="rounded-xl border border-dashed border-edge py-6 text-center">
                      <p className="text-[11px] text-faint">—</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Single application card ─────────────────────────────────────────────────

function AppCard({
  app,
  tone,
  moving,
  onMove,
}: {
  app: Application;
  tone: { card: string };
  moving: boolean;
  onMove: (id: string, status: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const validNext = PIPELINE_STATUSES.filter((s) => s !== app.status);

  return (
    <div
      className={`relative rounded-xl border bg-surface p-3 transition ${tone.card} ${
        moving ? "opacity-50" : "hover:shadow-sm"
      }`}
    >
      {/* Title */}
      <Link href={`/jobs/${app.job.id}`} className="block">
        <p className="truncate text-xs font-semibold text-foreground hover:text-accent transition">
          {app.job.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted">{app.job.company}</p>
      </Link>

      {/* Scores */}
      {(app.matchScoreSnapshot !== null || app.atsScoreSnapshot !== null) && (
        <div className="mt-2 flex items-center gap-2">
          {app.matchScoreSnapshot !== null && (
            <ScorePill label="M" score={app.matchScoreSnapshot} />
          )}
          {app.atsScoreSnapshot !== null && (
            <ScorePill label="A" score={app.atsScoreSnapshot} />
          )}
        </div>
      )}

      {/* Applied date */}
      {app.appliedAt && (
        <p className="mt-1.5 text-[10px] text-faint">
          Applied {new Date(app.appliedAt).toLocaleDateString()}
        </p>
      )}

      {/* Move menu */}
      <div className="mt-2 flex items-center justify-between">
        <Link
          href={`/jobs/${app.job.id}/studio`}
          className="text-[10px] text-faint underline underline-offset-2 hover:text-accent transition"
        >
          Studio
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-md border border-edge px-2 py-0.5 text-[10px] text-muted transition hover:border-edge-strong hover:text-foreground"
          >
            Move ↕
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border border-edge bg-surface shadow-lg">
              {validNext.map((s) => (
                <button
                  key={s}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-muted transition hover:bg-surface2 hover:text-foreground first:rounded-t-xl last:rounded-b-xl"
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(app.id, s);
                  }}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${columnTone[s as PipelineStatus].dot}`}
                  />
                  {STATUS_LABELS[s as PipelineStatus]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const color =
    score >= 75 ? "text-accent bg-accent/10 border-accent/30" :
    score >= 55 ? "text-warn bg-warn/10 border-warn/30" :
    "text-danger bg-danger/10 border-danger/30";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${color}`}>
      <span className="text-[9px] font-normal opacity-70">{label}</span>
      {score}
    </span>
  );
}
