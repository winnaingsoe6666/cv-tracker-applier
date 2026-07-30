"use client";

import { MatchBreakdown } from "@/lib/scoring/match";
import { AtsBreakdown, Severity } from "@/lib/scoring/ats";
import { ScoreRing, Bar, Badge, Card, CardTitle } from "@/components/ui";

// ─── Match Report ─────────────────────────────────────────────────────────────

interface MatchReportProps {
  matchScore: number;
  atsScore: number;
  matchBreakdown: MatchBreakdown;
  atsBreakdown: AtsBreakdown;
  atsThreshold: number;
  matchThreshold: number;
}

export function MatchReport({
  matchScore,
  atsScore,
  matchBreakdown,
  atsBreakdown,
  atsThreshold,
  matchThreshold,
}: MatchReportProps) {
  return (
    <div className="space-y-5">
      {/* Score summary row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ScoreSummaryCard
          label="JD Match"
          score={matchScore}
          threshold={matchThreshold}
          hint={`Threshold: ${matchThreshold}`}
        />
        <ScoreSummaryCard
          label="ATS Score"
          score={atsScore}
          threshold={atsThreshold}
          hint={`Threshold: ${atsThreshold}`}
        />
        <ComponentBreakdownMini label="Match components" components={matchBreakdown.components} />
        <ComponentBreakdownMini
          label="ATS components"
          components={atsBreakdown.categories.map((c) => ({
            name: c.category,
            score: c.score,
            weight: c.weight,
          }))}
        />
      </div>

      {/* Skills overlap */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle sub={`${matchBreakdown.matchedSkills.length} found on your resume`}>
            Matched Skills
          </CardTitle>
          {matchBreakdown.matchedSkills.length === 0 ? (
            <p className="text-xs text-faint">No JD skills detected or none matched.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {matchBreakdown.matchedSkills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardTitle sub={`${matchBreakdown.missingSkills.length} absent from your resume`}>
            Missing Skills
          </CardTitle>
          {matchBreakdown.missingSkills.length === 0 ? (
            <p className="text-xs text-accent">All JD skills found on your resume.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {matchBreakdown.missingSkills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Must-have requirements */}
      {matchBreakdown.mustHaves.length > 0 && (
        <Card>
          <CardTitle sub="Requirements extracted from the JD">Must-Have Requirements</CardTitle>
          <div className="space-y-2">
            {matchBreakdown.mustHaves.map((mh, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 shrink-0 text-sm ${mh.met ? "text-accent" : "text-danger"}`}
                >
                  {mh.met ? "✓" : "✗"}
                </span>
                <p className={`text-xs leading-relaxed ${mh.met ? "text-muted" : "text-foreground"}`}>
                  {mh.text}
                </p>
                {!mh.met && (
                  <Badge tone="danger">gap</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Seniority & Location risk */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Seniority Fit</CardTitle>
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 shrink-0 text-lg ${
                matchBreakdown.seniority.ok ? "text-accent" : "text-warn"
              }`}
            >
              {matchBreakdown.seniority.ok ? "✓" : "⚠"}
            </span>
            <div>
              <p className="text-sm text-foreground">{matchBreakdown.seniority.verdict}</p>
              {matchBreakdown.seniority.required && (
                <p className="mt-1 text-[11px] text-faint">
                  Target level: {matchBreakdown.seniority.required.toLowerCase()}
                  {matchBreakdown.seniority.resumeYears !== null &&
                    ` · Your experience: ~${matchBreakdown.seniority.resumeYears} yrs`}
                </p>
              )}
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle>Location / Eligibility Risk</CardTitle>
          <LocationRiskBadge risk={matchBreakdown.locationRisk} />
        </Card>
      </div>

      {/* ATS Findings */}
      <Card>
        <CardTitle sub="Issues that lower your parse score with ATS systems">
          ATS Findings
        </CardTitle>
        <div className="space-y-2">
          {atsBreakdown.findings.map((f, i) => (
            <FindingRow key={i} finding={f} />
          ))}
        </div>
      </Card>

      {/* Keyword coverage (when JD-aware) */}
      {atsBreakdown.keywordCoverage && (
        <Card>
          <CardTitle sub="Skills from the JD scanned against your resume">
            Keyword Coverage
          </CardTitle>
          <div className="mb-3">
            <Bar
              value={
                atsBreakdown.keywordCoverage.matched.length > 0 ||
                atsBreakdown.keywordCoverage.missing.length > 0
                  ? Math.round(
                      (atsBreakdown.keywordCoverage.matched.length /
                        (atsBreakdown.keywordCoverage.matched.length +
                          atsBreakdown.keywordCoverage.missing.length)) *
                        100
                    )
                  : 0
              }
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {atsBreakdown.keywordCoverage.matched.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"
              >
                {kw}
              </span>
            ))}
            {atsBreakdown.keywordCoverage.missing.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-edge bg-surface2 px-2 py-0.5 text-[11px] font-medium text-faint line-through"
              >
                {kw}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreSummaryCard({
  label,
  score,
  threshold,
  hint,
}: {
  label: string;
  score: number;
  threshold: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-edge bg-surface p-4">
      <ScoreRing score={score} size={80} threshold={threshold} label={label} />
      {hint && <p className="text-center text-[10px] text-faint">{hint}</p>}
    </div>
  );
}

function ComponentBreakdownMini({
  label,
  components,
}: {
  label: string;
  components: { name: string; score: number; weight: number }[];
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <p className="mb-3 text-[10px] font-semibold tracking-wide text-faint uppercase">{label}</p>
      <div className="space-y-2">
        {components.map((c) => (
          <div key={c.name}>
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-[10px] text-muted">{c.name}</span>
              <span className="text-[10px] font-semibold text-foreground">{c.score}</span>
            </div>
            <Bar value={c.score} />
          </div>
        ))}
      </div>
    </div>
  );
}

const severityConfig: Record<Severity, { icon: string; cls: string }> = {
  critical: { icon: "✗", cls: "text-danger" },
  warning: { icon: "⚠", cls: "text-warn" },
  pass: { icon: "✓", cls: "text-accent" },
};

function FindingRow({ finding }: { finding: { severity: Severity; category: string; message: string; fix: string } }) {
  const cfg = severityConfig[finding.severity];
  return (
    <div className="flex items-start gap-3 rounded-lg p-2 hover:bg-surface2">
      <span className={`mt-0.5 shrink-0 text-sm font-bold ${cfg.cls}`}>{cfg.icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wide text-faint uppercase">
            {finding.category}
          </span>
        </div>
        <p className="text-xs text-foreground">{finding.message}</p>
        {finding.fix && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{finding.fix}</p>
        )}
      </div>
    </div>
  );
}

function LocationRiskBadge({
  risk,
}: {
  risk: { level: "low" | "medium" | "high"; note: string };
}) {
  const cfg = {
    low: { icon: "✓", cls: "text-accent", label: "Low risk" },
    medium: { icon: "⚠", cls: "text-warn", label: "Medium risk" },
    high: { icon: "✗", cls: "text-danger", label: "High risk" },
  }[risk.level];
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 text-lg font-bold ${cfg.cls}`}>{cfg.icon}</span>
      <div>
        <p className={`text-sm font-semibold ${cfg.cls}`}>{cfg.label}</p>
        <p className="mt-1 text-xs text-muted">{risk.note}</p>
      </div>
    </div>
  );
}
