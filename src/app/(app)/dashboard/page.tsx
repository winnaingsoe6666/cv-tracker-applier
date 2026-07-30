import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PLANS, Plan } from "@/lib/constants";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const plan = PLANS[(user.plan as Plan) ?? "FREE"];

  const [resumeCount, jobCount, allApps] = await Promise.all([
    db.resume.count({ where: { userId: user.id, isBase: true } }),
    db.job.count({ where: { userId: user.id } }),
    db.application.findMany({
      where: { userId: user.id },
      include: { job: { select: { title: true, company: true, id: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const applied = allApps.filter((a) =>
    ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"].includes(a.status)
  ).length;
  const interviews = allApps.filter((a) =>
    ["INTERVIEW", "OFFER"].includes(a.status)
  ).length;
  const offers = allApps.filter((a) => a.status === "OFFER").length;
  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : null;

  const recentApps = allApps.slice(0, 6);

  const STATUS_LABELS: Record<string, string> = {
    SAVED: "Saved", TAILORING: "Tailoring", READY: "Ready", APPLIED: "Applied",
    SCREENING: "Screening", INTERVIEW: "Interview", OFFER: "Offer", REJECTED: "Rejected",
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Welcome back, {user.name}.</p>
        </div>
        {user.plan === "FREE" && (
          <Link
            href="/settings"
            className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
          >
            FREE plan · Upgrade →
          </Link>
        )}
      </div>

      {/* Conversion stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jobs tracked" value={jobCount} href="/jobs" />
        <StatCard label="Applied" value={applied} href="/pipeline" />
        <StatCard label="Interviews" value={interviews} href="/pipeline" tone="warn" />
        <StatCard label="Offers" value={offers} href="/pipeline" tone="accent" />
      </div>

      {/* Interview rate highlight */}
      {interviewRate !== null && (
        <div className={`mb-6 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 ${
          interviewRate >= 20
            ? "border-accent/30 bg-accent/5"
            : "border-warn/30 bg-warn/5"
        }`}>
          <div>
            <p className={`text-2xl font-bold ${interviewRate >= 20 ? "text-accent" : "text-warn"}`}>
              {interviewRate}%
            </p>
            <p className="mt-0.5 text-xs text-muted">
              interview rate ({interviews} interviews from {applied} applied)
              {interviewRate >= 20
                ? " — above average. The quality gate is working."
                : " — below 20%. Check your match scores on the Insights page."}
            </p>
          </div>
          <Link
            href="/insights"
            className="shrink-0 rounded-lg border border-edge px-3 py-1.5 text-xs text-muted transition hover:border-edge-strong hover:text-foreground"
          >
            Insights →
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Recent applications */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold tracking-wide text-faint uppercase">Recent applications</h2>
            <Link href="/pipeline" className="text-[11px] text-muted hover:text-foreground transition">
              View all →
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge-strong py-12 text-center">
              <p className="text-sm font-medium text-foreground">No applications yet</p>
              <p className="mt-1 text-xs text-muted">Track a job and run the match engine to start.</p>
              <Link href="/jobs" className="mt-3 text-xs text-accent hover:underline">Track a job →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentApps.map((a) => (
                <Link
                  key={a.id}
                  href={`/jobs/${a.job.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-surface px-4 py-3 transition hover:border-accent/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.job.title}</p>
                    <p className="text-xs text-muted">{a.job.company}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {a.matchScoreSnapshot !== null && (
                      <span className={`text-xs font-semibold ${
                        a.matchScoreSnapshot >= 70 ? "text-accent" :
                        a.matchScoreSnapshot >= 50 ? "text-warn" : "text-danger"
                      }`}>
                        M:{a.matchScoreSnapshot}
                      </span>
                    )}
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                      ["INTERVIEW", "OFFER"].includes(a.status) ? "border-accent/30 bg-accent/10 text-accent" :
                      a.status === "REJECTED" ? "border-danger/30 bg-danger/10 text-danger" :
                      "border-edge bg-surface2 text-muted"
                    }`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Plan usage + quick actions */}
        <div className="space-y-5">
          {/* Plan usage */}
          <div className="rounded-xl border border-edge bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">Plan usage</p>
              <span className="rounded-md border border-edge bg-surface2 px-2 py-0.5 text-[10px] font-medium text-muted">
                {user.plan}
              </span>
            </div>
            <div className="space-y-3">
              <UsageBar label="Resumes" used={resumeCount} limit={plan.maxResumes} />
              <UsageBar label="Jobs tracked" used={jobCount} limit={plan.maxJobs} />
            </div>
            {user.plan === "FREE" && (
              <Link
                href="/settings"
                className="mt-3 flex w-full items-center justify-center rounded-lg border border-accent/30 bg-accent/5 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-accent/10"
              >
                Upgrade to Pro →
              </Link>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-edge bg-surface p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-wide text-faint uppercase">Quick actions</p>
            <div className="space-y-1.5">
              {[
                { href: "/resumes", label: "Upload a resume" },
                { href: "/jobs", label: "Track a job" },
                { href: "/pipeline", label: "Update pipeline" },
                { href: "/insights", label: "View insights" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-surface2 hover:text-foreground"
                >
                  {l.label}
                  <span className="text-faint">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, href, tone = "neutral",
}: {
  label: string; value: number; href: string; tone?: "neutral" | "warn" | "accent";
}) {
  const cls = {
    neutral: "border-edge bg-surface hover:border-edge-strong",
    warn: "border-warn/30 bg-warn/5 hover:border-warn/50",
    accent: "border-accent/30 bg-accent/5 hover:border-accent/50",
  }[tone];
  const textCls = { neutral: "text-foreground", warn: "text-warn", accent: "text-accent" }[tone];
  return (
    <Link href={href} className={`flex flex-col rounded-xl border p-5 transition ${cls}`}>
      <span className={`text-3xl font-bold ${textCls}`}>{value}</span>
      <span className="mt-1 text-[11px] font-medium text-faint uppercase tracking-wide">{label}</span>
    </Link>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit >= 1000 ? 0 : Math.min((used / limit) * 100, 100);
  const color = pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--warn)" : "var(--accent)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted">{label}</span>
        <span className="text-faint">{used} / {limit >= 1000 ? "∞" : limit}</span>
      </div>
      {limit < 1000 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  );
}
