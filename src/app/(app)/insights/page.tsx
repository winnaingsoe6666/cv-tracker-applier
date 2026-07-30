import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { MARKETS } from "@/lib/constants";
import { Card, CardTitle, Bar, ScoreRing } from "@/components/ui";

// ─── Data helpers ─────────────────────────────────────────────────────────────

function matchBand(score: number | null): string {
  if (score === null) return "Unscored";
  if (score >= 80) return "80–100";
  if (score >= 65) return "65–79";
  if (score >= 50) return "50–64";
  return "< 50";
}

const BAND_ORDER = ["80–100", "65–79", "50–64", "< 50", "Unscored"];

function daysBetween(a: Date, b: Date) {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function InsightsPage() {
  const user = await requireUser();

  const applications = await db.application.findMany({
    where: { userId: user.id },
    include: {
      job: { select: { market: true, seniority: true, title: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const total = applications.length;
  const applied = applications.filter((a) =>
    ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"].includes(a.status)
  );
  const screened = applications.filter((a) =>
    ["SCREENING", "INTERVIEW", "OFFER"].includes(a.status)
  );
  const interviewed = applications.filter((a) =>
    ["INTERVIEW", "OFFER"].includes(a.status)
  );
  const offered = applications.filter((a) => a.status === "OFFER");
  const rejected = applications.filter((a) => a.status === "REJECTED");

  // Funnel rates
  const applyRate = total > 0 ? Math.round((applied.length / total) * 100) : 0;
  const screenRate = applied.length > 0 ? Math.round((screened.length / applied.length) * 100) : 0;
  const interviewRate = applied.length > 0 ? Math.round((interviewed.length / applied.length) * 100) : 0;
  const offerRate = applied.length > 0 ? Math.round((offered.length / applied.length) * 100) : 0;

  // Interview rate by match band
  type BandStat = { applied: number; interviewed: number; rate: number };
  const bandStats: Record<string, BandStat> = {};
  for (const a of applications) {
    if (!["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"].includes(a.status)) continue;
    const band = matchBand(a.matchScoreSnapshot);
    if (!bandStats[band]) bandStats[band] = { applied: 0, interviewed: 0, rate: 0 };
    bandStats[band].applied++;
    if (["INTERVIEW", "OFFER"].includes(a.status)) bandStats[band].interviewed++;
  }
  for (const b of Object.values(bandStats)) {
    b.rate = b.applied > 0 ? Math.round((b.interviewed / b.applied) * 100) : 0;
  }

  // By market
  type MarketStat = { applied: number; interviewed: number };
  const marketStats: Record<string, MarketStat> = {};
  for (const a of applied) {
    const m = a.job.market;
    if (!marketStats[m]) marketStats[m] = { applied: 0, interviewed: 0 };
    marketStats[m].applied++;
    if (["INTERVIEW", "OFFER"].includes(a.status)) marketStats[m].interviewed++;
  }

  // Avg match score of applications that got interviews vs not
  const interviewedScores = interviewed
    .map((a) => a.matchScoreSnapshot)
    .filter((s): s is number => s !== null);
  const rejectedScores = rejected
    .map((a) => a.matchScoreSnapshot)
    .filter((s): s is number => s !== null);
  const avgInterviewScore =
    interviewedScores.length > 0
      ? Math.round(interviewedScores.reduce((s, v) => s + v, 0) / interviewedScores.length)
      : null;
  const avgRejectedScore =
    rejectedScores.length > 0
      ? Math.round(rejectedScores.reduce((s, v) => s + v, 0) / rejectedScores.length)
      : null;

  // Avg days from saved → applied
  const daysToApply: number[] = [];
  for (const a of applied) {
    if (!a.appliedAt) continue;
    const savedEvent = a.events[0];
    if (savedEvent) {
      daysToApply.push(daysBetween(savedEvent.createdAt, a.appliedAt));
    } else {
      daysToApply.push(daysBetween(a.createdAt, a.appliedAt));
    }
  }
  const avgDaysToApply =
    daysToApply.length > 0
      ? Math.round(daysToApply.reduce((s, v) => s + v, 0) / daysToApply.length)
      : null;

  const hasData = applied.length >= 3;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-muted">
          Conversion cockpit — what scores correlate with interviews.
        </p>
      </div>

      {!hasData && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-info/30 bg-info/5 px-4 py-3">
          <span className="text-info text-lg">ℹ</span>
          <p className="text-xs text-muted">
            You need at least 3 applied applications to see meaningful analytics.{" "}
            {applied.length > 0 && `You currently have ${applied.length}.`}
          </p>
        </div>
      )}

      {/* Funnel */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <FunnelCard label="Tracked" value={total} />
        <FunnelCard label="Applied" value={applied.length} rate={applyRate} rateLabel="of tracked" />
        <FunnelCard label="Interviews" value={interviewed.length} rate={interviewRate} rateLabel="of applied" tone="warn" />
        <FunnelCard label="Offers" value={offered.length} rate={offerRate} rateLabel="of applied" tone="accent" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Interview rate by match band */}
        <Card>
          <CardTitle sub="Does your match score predict interviews?">
            Interview Rate by Match Band
          </CardTitle>
          {BAND_ORDER.filter((b) => bandStats[b]).length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {BAND_ORDER.filter((b) => bandStats[b]).map((band) => {
                const s = bandStats[band];
                return (
                  <div key={band}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{band}</span>
                      <span className="text-muted">
                        {s.interviewed} / {s.applied} →{" "}
                        <span className={s.rate >= 20 ? "font-semibold text-accent" : "text-warn"}>
                          {s.rate}%
                        </span>
                      </span>
                    </div>
                    <Bar value={s.rate} tone={s.rate >= 20 ? "accent" : s.rate >= 10 ? "warn" : "danger"} />
                  </div>
                );
              })}
              {avgInterviewScore !== null && avgRejectedScore !== null && (
                <div className="mt-4 rounded-lg border border-edge bg-surface2 px-3 py-2">
                  <p className="text-[11px] text-muted">
                    Avg match score — <span className="text-accent font-semibold">interviews: {avgInterviewScore}</span>
                    {" · "}
                    <span className="text-danger font-semibold">rejections: {avgRejectedScore}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* By market */}
        <Card>
          <CardTitle sub="Where your applications convert">Interview Rate by Market</CardTitle>
          {Object.keys(marketStats).length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {Object.entries(marketStats)
                .sort((a, b) => b[1].applied - a[1].applied)
                .map(([market, s]) => {
                  const label = MARKETS.find((m) => m.value === market)?.label ?? market;
                  const rate = s.applied > 0 ? Math.round((s.interviewed / s.applied) * 100) : 0;
                  return (
                    <div key={market}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="text-muted">
                          {s.interviewed}/{s.applied} →{" "}
                          <span className={rate >= 20 ? "font-semibold text-accent" : "text-warn"}>
                            {rate}%
                          </span>
                        </span>
                      </div>
                      <Bar value={rate} tone={rate >= 20 ? "accent" : rate >= 10 ? "warn" : "danger"} />
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* Score advantage panel */}
        {(avgInterviewScore !== null || avgRejectedScore !== null) && (
          <Card>
            <CardTitle sub="Match score gap between outcomes">Score vs Outcome</CardTitle>
            <div className="flex items-center justify-around py-4">
              {avgInterviewScore !== null && (
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={avgInterviewScore} size={88} threshold={70} />
                  <p className="text-xs font-medium text-accent">Interviewed</p>
                  <p className="text-[11px] text-faint">avg match score</p>
                </div>
              )}
              {avgInterviewScore !== null && avgRejectedScore !== null && (
                <div className="text-2xl text-faint">vs</div>
              )}
              {avgRejectedScore !== null && (
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={avgRejectedScore} size={88} threshold={70} />
                  <p className="text-xs font-medium text-danger">Rejected / No response</p>
                  <p className="text-[11px] text-faint">avg match score</p>
                </div>
              )}
            </div>
            {avgInterviewScore !== null && avgRejectedScore !== null && (
              <p className="text-center text-[11px] text-muted">
                {avgInterviewScore > avgRejectedScore
                  ? `Higher match scores are correlating with interviews (+${avgInterviewScore - avgRejectedScore} pts gap).`
                  : "Not enough separation yet — keep tracking to surface the pattern."}
              </p>
            )}
          </Card>
        )}

        {/* Speed metrics */}
        <Card>
          <CardTitle sub="Time efficiency">Speed Metrics</CardTitle>
          <div className="space-y-4 py-2">
            <SpeedRow
              label="Avg days: Saved → Applied"
              value={avgDaysToApply !== null ? `${avgDaysToApply}d` : "—"}
              hint={
                avgDaysToApply !== null
                  ? avgDaysToApply <= 3
                    ? "Fast pipeline — good signal for motivated candidates"
                    : avgDaysToApply <= 7
                      ? "Moderate — consider tightening the tailoring loop"
                      : "Slow — long tailoring cycles may indicate over-engineering"
                  : "Apply to jobs to measure this"
              }
            />
            <SpeedRow
              label="Applied → Interview (estimated)"
              value={interviewed.length > 0 ? "✓" : "—"}
              hint={
                interviewRate > 0
                  ? `${interviewRate}% of applications progressed to interview`
                  : "No interview responses tracked yet"
              }
            />
            <SpeedRow
              label="Rejection rate"
              value={applied.length > 0 ? `${Math.round((rejected.length / applied.length) * 100)}%` : "—"}
              hint={`${rejected.length} rejections out of ${applied.length} applied`}
            />
          </div>
        </Card>
      </div>

      {/* ── Market Trend Briefs ───────────────────────────── */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Market Trends</h2>
          <p className="mt-1 text-xs text-muted">
            SEA + Remote tech job demand briefs — skills, salary ranges, and hiring heat.
            Updated quarterly.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <MarketTrendCard
            market="Thailand"
            flag="🇹🇭"
            code="TH"
            demand="growing"
            topSkills={["Node.js", "React", "Python", "Docker", "PostgreSQL"]}
            salaryRange="฿60k–฿150k / mo"
            salaryUsd="$1,700–$4,300"
            remotePct={28}
            hotRoles={["Backend Engineer", "Full-Stack Dev", "Data Engineer", "DevOps"]}
            note="Bangkok tech scene expanding fast; fintech, logistics, e-commerce dominate hiring."
          />
          <MarketTrendCard
            market="Malaysia"
            flag="🇲🇾"
            code="MY"
            demand="hot"
            topSkills={["Java", "React", "AWS", "Kubernetes", "Golang"]}
            salaryRange="RM 6k–RM 18k / mo"
            salaryUsd="$1,300–$3,900"
            remotePct={42}
            hotRoles={["Cloud Engineer", "Backend Developer", "SRE", "Mobile (Flutter)"]}
            note="KL hub for ASEAN engineering teams; high demand for cloud & DevOps profiles."
          />
          <MarketTrendCard
            market="Singapore"
            flag="🇸🇬"
            code="SG"
            demand="hot"
            topSkills={["Python", "Kubernetes", "TypeScript", "Spark", "Terraform"]}
            salaryRange="S$7k–S$18k / mo"
            salaryUsd="$5,200–$13,400"
            remotePct={35}
            hotRoles={["Data Engineer", "Platform Engineer", "ML Engineer", "Tech Lead"]}
            note="Premium salaries; strong visa support for tech roles. High bar for seniority."
          />
          <MarketTrendCard
            market="Remote (Global)"
            flag="🌏"
            code="REMOTE"
            demand="hot"
            topSkills={["TypeScript", "Rust", "Go", "AWS", "System Design"]}
            salaryRange="$4k–$15k / mo"
            salaryUsd="$4,000–$15,000"
            remotePct={100}
            hotRoles={["Staff Engineer", "Distributed Systems", "API Platform", "Open-Source Dev"]}
            note="US/EU timezone overlap preferred. Async-first companies growing. Contract roles abundant."
          />
        </div>
        <p className="mt-3 text-[11px] text-faint">
          Source: aggregated from LinkedIn Talent Insights, JobStreet reports, and Glassdoor market data (Q2 2026).
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FunnelCard({
  label,
  value,
  rate,
  rateLabel,
  tone = "neutral",
}: {
  label: string;
  value: number;
  rate?: number;
  rateLabel?: string;
  tone?: "neutral" | "warn" | "accent";
}) {
  const valueColor =
    tone === "accent" ? "text-accent" : tone === "warn" ? "text-warn" : "text-foreground";
  const borderColor =
    tone === "accent"
      ? "border-accent/30 bg-accent/5"
      : tone === "warn"
        ? "border-warn/30 bg-warn/5"
        : "border-edge bg-surface";
  return (
    <div className={`flex flex-col rounded-xl border p-5 ${borderColor}`}>
      <span className={`text-3xl font-bold ${valueColor}`}>{value}</span>
      <span className="mt-1 text-xs font-medium text-faint uppercase tracking-wide">{label}</span>
      {rate !== undefined && (
        <span className={`mt-2 text-[11px] ${valueColor}`}>
          {rate}% {rateLabel}
        </span>
      )}
    </div>
  );
}

function SpeedRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-faint">{hint}</p>
      </div>
      <span className="shrink-0 text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-4 text-center text-xs text-faint">
      No data yet — apply to jobs and track outcomes.
    </p>
  );
}

type DemandLevel = "hot" | "growing" | "stable";
const demandConfig: Record<DemandLevel, { label: string; cls: string }> = {
  hot:     { label: "🔥 Hot",     cls: "border-warn/30 bg-warn/8 text-warn" },
  growing: { label: "📈 Growing", cls: "border-info/30 bg-info/8 text-info" },
  stable:  { label: "〰 Stable",  cls: "border-edge bg-surface2 text-muted" },
};

function MarketTrendCard({
  market,
  flag,
  demand,
  topSkills,
  salaryRange,
  salaryUsd,
  remotePct,
  hotRoles,
  note,
}: {
  market: string;
  flag: string;
  code: string;
  demand: DemandLevel;
  topSkills: string[];
  salaryRange: string;
  salaryUsd: string;
  remotePct: number;
  hotRoles: string[];
  note: string;
}) {
  const d = demandConfig[demand];
  return (
    <div className="rounded-xl border border-edge bg-surface p-5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{flag}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{market}</p>
            <p className="text-[11px] text-muted">{salaryRange}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${d.cls}`}>
          {d.label}
        </span>
      </div>

      {/* Salary + remote */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-edge bg-surface2 px-3 py-2">
          <p className="text-[10px] font-medium text-faint uppercase tracking-wide">USD equiv.</p>
          <p className="mt-0.5 text-xs font-bold text-foreground">{salaryUsd}</p>
        </div>
        <div className="rounded-lg border border-edge bg-surface2 px-3 py-2">
          <p className="text-[10px] font-medium text-faint uppercase tracking-wide">Remote %</p>
          <p className="mt-0.5 text-xs font-bold text-foreground">{remotePct}%</p>
        </div>
      </div>

      {/* Top skills */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">Top Demanded Skills</p>
        <div className="flex flex-wrap gap-1">
          {topSkills.map((s) => (
            <span key={s} className="rounded-md border border-accent/25 bg-accent/8 px-2 py-0.5 text-[10px] font-medium text-accent">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Hot roles */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">Hot Role Families</p>
        <div className="space-y-1">
          {hotRoles.map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-warn shrink-0" />
              <span className="text-[11px] text-foreground">{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <p className="mt-3 border-t border-edge pt-3 text-[11px] text-muted leading-relaxed">{note}</p>
    </div>
  );
}
