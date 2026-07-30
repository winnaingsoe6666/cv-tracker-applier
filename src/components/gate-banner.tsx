"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GateBannerProps {
  atsScore: number | null;
  matchScore: number | null;
  atsThreshold: number;
  matchThreshold: number;
  applicationId: string;
  currentStatus: string;
}

export function GateBanner({
  atsScore,
  matchScore,
  atsThreshold,
  matchThreshold,
  applicationId,
  currentStatus,
}: GateBannerProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No scores yet — prompt user to run match
  if (atsScore === null || matchScore === null) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface px-5 py-4">
        <span className="text-faint text-xl">◌</span>
        <div>
          <p className="text-sm font-medium text-foreground">Quality gate not yet evaluated</p>
          <p className="mt-0.5 text-xs text-muted">
            Select a resume and run the match analysis to check if this application passes your
            thresholds.
          </p>
        </div>
      </div>
    );
  }

  const atsFail = atsScore < atsThreshold;
  const matchFail = matchScore < matchThreshold;
  const pass = !atsFail && !matchFail;

  async function applyTransition(toStatus: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStatus }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update status.");
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (pass) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-accent">✓</span>
          <div>
            <p className="text-sm font-semibold text-accent">Quality gate passed</p>
            <p className="mt-0.5 text-xs text-muted">
              ATS {atsScore} ≥ {atsThreshold} · Match {matchScore} ≥ {matchThreshold}. Strong fit —
              proceed to apply.
            </p>
          </div>
        </div>
        {currentStatus !== "APPLIED" && currentStatus !== "OFFER" && (
          <button
            className="shrink-0 rounded-lg bg-accent-dim px-4 py-2 text-sm font-semibold text-[#06281c] transition hover:bg-accent disabled:opacity-40"
            disabled={loading}
            onClick={() => applyTransition("READY")}
          >
            {loading ? "Updating…" : "Mark as Ready"}
          </button>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // Fail state
  const failures: string[] = [];
  if (atsFail) failures.push(`ATS ${atsScore} < ${atsThreshold}`);
  if (matchFail) failures.push(`Match ${matchScore} < ${matchThreshold}`);

  return (
    <div className="rounded-xl border border-danger/40 bg-danger/5 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl text-danger">✗</span>
          <div>
            <p className="text-sm font-semibold text-danger">Quality gate failed</p>
            <p className="mt-0.5 text-xs text-muted">
              {failures.join(" · ")}. Fix the issues below before applying to maximise interview
              odds.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {!confirming ? (
            <button
              className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/20"
              onClick={() => setConfirming(true)}
            >
              Override & apply anyway
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-warn">Are you sure? Lower scores = lower interview rate.</p>
              <button
                className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/20 disabled:opacity-40"
                disabled={loading}
                onClick={() => applyTransition("APPLIED")}
              >
                {loading ? "Updating…" : "Confirm apply"}
              </button>
              <button
                className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
