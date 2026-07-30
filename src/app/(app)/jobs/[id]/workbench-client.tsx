"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, ScoreRing } from "@/components/ui";
import { MatchReport } from "@/components/match-report";
import { GateBanner } from "@/components/gate-banner";
import type { MatchBreakdown } from "@/lib/scoring/match";
import type { AtsBreakdown, Severity } from "@/lib/scoring/ats";

interface Resume {
  id: string;
  title: string;
  isBase: boolean;
  roleFamily: string | null;
}

interface Application {
  id: string;
  status: string;
  atsScoreSnapshot: number | null;
  matchScoreSnapshot: number | null;
  resumeId: string | null;
}

interface MatchData {
  matchReportId: string;
  matchScore: number;
  atsScore: number;
  matchBreakdown: MatchBreakdown;
  atsBreakdown: AtsBreakdown;
}

interface WorkbenchClientProps {
  jobId: string;
  resumes: Resume[];
  application: Application;
  lastMatchData: MatchData | null;
  atsThreshold: number;
  matchThreshold: number;
  jobTitle: string;
}

type Tab = "match" | "ats";

export function WorkbenchClient({
  jobId,
  resumes,
  application,
  lastMatchData,
  atsThreshold,
  matchThreshold,
  jobTitle,
}: WorkbenchClientProps) {
  const router = useRouter();

  // Auto-suggest: find best resume by matching roleFamily to JD keywords
  const suggestedId = (() => {
    if (application.resumeId) return application.resumeId; // user already picked
    if (resumes.length === 0) return "";
    const title = jobTitle.toLowerCase();
    const roleKeywords: Record<string, string[]> = {
      BACKEND: ["backend", "server", "api", "java", "go", "golang", "python", "node", "rails"],
      FULLSTACK: ["fullstack", "full-stack", "full stack", "react", "vue", "angular"],
      DATA: ["data", "ml", "machine learning", "analytics", "python", "spark", "sql"],
      DEVOPS: ["devops", "sre", "infrastructure", "cloud", "kubernetes", "docker", "aws", "gcp"],
      MOBILE: ["mobile", "ios", "android", "flutter", "react native", "swift", "kotlin"],
    };
    for (const [family, keywords] of Object.entries(roleKeywords)) {
      if (keywords.some((kw) => title.includes(kw))) {
        const match = resumes.find((r) => r.roleFamily === family);
        if (match) return match.id;
      }
    }
    return resumes[0]?.id ?? "";
  })();

  const [selectedResumeId, setSelectedResumeId] = useState<string>(suggestedId);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMatchData, setCurrentMatchData] = useState<MatchData | null>(lastMatchData);
  const [tab, setTab] = useState<Tab>("match");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runMatch() {
    if (!selectedResumeId) return;
    setRunning(true);
    setError(null);
    const res = await fetch(`/api/jobs/${jobId}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: selectedResumeId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRunning(false);
      setError(data.error ?? "Match analysis failed.");
      return;
    }
    // Fetch full breakdown
    const detailRes = await fetch(
      `/api/jobs/${jobId}/match/latest?resumeId=${selectedResumeId}`
    );
    setRunning(false);
    if (detailRes.ok) {
      const detail = await detailRes.json();
      setCurrentMatchData(detail);
    }
    router.refresh();
  }

  async function shareReport() {
    if (!currentMatchData?.matchReportId) return;
    setShareLoading(true);
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchReportId: currentMatchData.matchReportId }),
    });
    setShareLoading(false);
    if (res.ok) {
      const data = await res.json();
      setShareUrl(`${window.location.origin}${data.url}`);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayAts = currentMatchData?.atsScore ?? application.atsScoreSnapshot;
  const displayMatch = currentMatchData?.matchScore ?? application.matchScoreSnapshot;

  return (
    <div className="space-y-5">
      {/* Resume picker + run match */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-edge bg-surface p-4">
        <div className="flex-1 min-w-48">
          <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-faint uppercase">
            Resume to match
          </label>
          {resumes.length === 0 ? (
            <p className="text-sm text-muted">
              No resumes yet.{" "}
              <a href="/resumes" className="text-accent underline underline-offset-2">
                Upload one first →
              </a>
            </p>
          ) : (
            <>
              <select
                className="w-full rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                    {!r.isBase ? " (variant)" : ""}
                    {r.id === suggestedId && r.id !== application.resumeId ? " ★ Recommended" : ""}
                  </option>
                ))}
              </select>
              {suggestedId && suggestedId !== application.resumeId && (
                <p className="mt-1.5 text-[11px] text-accent">
                  ★ Best-fit resume auto-selected by role family
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {(displayMatch !== null || displayAts !== null) && (
            <div className="flex items-center gap-2">
              {displayMatch !== null && (
                <div className="flex flex-col items-center">
                  <ScoreRing score={displayMatch} size={52} threshold={matchThreshold} />
                  <span className="mt-1 text-[9px] text-faint uppercase tracking-wide">Match</span>
                </div>
              )}
              {displayAts !== null && (
                <div className="flex flex-col items-center">
                  <ScoreRing score={displayAts} size={52} threshold={atsThreshold} />
                  <span className="mt-1 text-[9px] text-faint uppercase tracking-wide">ATS</span>
                </div>
              )}
            </div>
          )}
          <button
            className={btnPrimary}
            disabled={running || !selectedResumeId || resumes.length === 0}
            onClick={runMatch}
          >
            {running ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyzing…
              </>
            ) : currentMatchData || application.atsScoreSnapshot !== null ? (
              "Re-run match"
            ) : (
              "Run match"
            )}
          </button>
        </div>
        {error && <p className="w-full text-xs text-danger">{error}</p>}
      </div>

      {/* Gate banner */}
      <GateBanner
        atsScore={displayAts}
        matchScore={displayMatch}
        atsThreshold={atsThreshold}
        matchThreshold={matchThreshold}
        applicationId={application.id}
        currentStatus={application.status}
      />

      {/* Share report */}
      {currentMatchData?.matchReportId && (
        <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3">
          <span className="text-xs text-muted">Share this match report:</span>
          {shareUrl ? (
            <div className="flex flex-1 items-center gap-2">
              <code className="flex-1 truncate rounded border border-edge bg-surface2 px-2 py-1 font-mono text-[11px] text-faint">
                {shareUrl}
              </code>
              <button
                onClick={copyShareUrl}
                className="shrink-0 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20"
              >
                {copied ? "✓ Copied" : "Copy link"}
              </button>
            </div>
          ) : (
            <button
              onClick={shareReport}
              disabled={shareLoading}
              className="rounded-lg border border-edge bg-surface2 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              {shareLoading ? "Generating…" : "Generate share link"}
            </button>
          )}
        </div>
      )}

      {/* Detailed reports */}
      {currentMatchData ? (
        <>
          <div className="flex gap-1 rounded-lg border border-edge bg-surface p-1">
            {(["match", "ats"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  tab === t
                    ? "bg-surface2 text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t === "match" ? "Match Report" : "ATS & Keywords"}
              </button>
            ))}
          </div>

          {tab === "match" ? (
            <MatchReport
              matchScore={currentMatchData.matchScore}
              atsScore={currentMatchData.atsScore}
              matchBreakdown={currentMatchData.matchBreakdown}
              atsBreakdown={currentMatchData.atsBreakdown}
              atsThreshold={atsThreshold}
              matchThreshold={matchThreshold}
            />
          ) : (
            <AtsPanel breakdown={currentMatchData.atsBreakdown} />
          )}
        </>
      ) : (
        !running && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge-strong py-16 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-surface2 text-faint text-lg">
              ◎
            </div>
            <p className="text-sm font-medium text-foreground">No match report yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted">
              Select a resume and click "Run match" to get your JD match score, skills gap, seniority
              analysis, and ATS breakdown side-by-side.
            </p>
          </div>
        )
      )}
    </div>
  );
}

// ─── ATS detail panel ─────────────────────────────────────────────────────────

const severityIcon: Record<Severity, { icon: string; cls: string }> = {
  critical: { icon: "✗", cls: "text-danger" },
  warning: { icon: "⚠", cls: "text-warn" },
  pass: { icon: "✓", cls: "text-accent" },
};

function AtsPanel({ breakdown }: { breakdown: AtsBreakdown }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-edge bg-surface p-5">
        <p className="mb-4 text-[11px] font-semibold tracking-wide text-faint uppercase">
          ATS Category Scores
        </p>
        <div className="space-y-3">
          {breakdown.categories.map((cat) => {
            const color =
              cat.score >= 75 ? "var(--accent)" : cat.score >= 55 ? "var(--warn)" : "var(--danger)";
            return (
              <div key={cat.category}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {cat.category}
                    <span className="ml-1 text-[10px] text-faint">({cat.weight}%)</span>
                  </span>
                  <span className="text-xs font-semibold text-foreground">{cat.score}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.score}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-edge bg-surface p-5">
        <p className="mb-4 text-[11px] font-semibold tracking-wide text-faint uppercase">
          Findings
        </p>
        <div className="space-y-2">
          {breakdown.findings.map((f, i) => {
            const cfg = severityIcon[f.severity];
            return (
              <div key={i} className="flex items-start gap-3 rounded-lg p-2 hover:bg-surface2">
                <span className={`mt-0.5 shrink-0 text-sm font-bold ${cfg.cls}`}>{cfg.icon}</span>
                <div>
                  <p className="text-[10px] font-semibold tracking-wide text-faint uppercase">
                    {f.category}
                  </p>
                  <p className="text-xs text-foreground">{f.message}</p>
                  {f.fix && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{f.fix}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {breakdown.keywordCoverage && (
        <div className="rounded-xl border border-edge bg-surface p-5">
          <p className="mb-3 text-[11px] font-semibold tracking-wide text-faint uppercase">
            Keyword Coverage vs JD
          </p>
          <div className="flex flex-wrap gap-1.5">
            {breakdown.keywordCoverage.matched.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"
              >
                {kw}
              </span>
            ))}
            {breakdown.keywordCoverage.missing.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-edge bg-surface2 px-2 py-0.5 text-[11px] font-medium text-faint line-through"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
