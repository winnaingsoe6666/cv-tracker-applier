import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ScoreRing, Bar } from "@/components/ui";
import type { MatchBreakdown } from "@/lib/scoring/match";

/**
 * /report/[token] — Public, no-auth read-only match report.
 * Validates token expiry and renders a clean, shareable view.
 */
export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const share = await db.shareToken.findUnique({ where: { token } });
  if (!share || share.expiresAt < new Date()) notFound();

  const report = await db.matchReport.findUnique({
    where: { id: share.refId },
    include: {
      job: { select: { title: true, company: true, market: true, seniority: true } },
      resume: { select: { title: true } },
    },
  });
  if (!report) notFound();

  const breakdown: MatchBreakdown = JSON.parse(report.breakdownJson);
  const daysLeft = Math.ceil((share.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e6edf3]">
      {/* Header */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#238636] text-sm font-bold text-white">
              C
            </div>
            <span className="font-semibold tracking-tight">CareerForge</span>
            <span className="ml-2 rounded-full border border-[#30363d] bg-[#1c2128] px-2 py-0.5 text-[10px] text-[#8b949e]">
              Shared report · expires in {daysLeft}d
            </span>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-[#238636]/50 bg-[#238636]/10 px-3 py-1.5 text-xs font-medium text-[#3fb950] transition hover:bg-[#238636]/20"
          >
            Sign in to CareerForge →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Job info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{report.job.title}</h1>
          <p className="mt-1 text-sm text-[#8b949e]">
            {report.job.company}
            {report.job.market && ` · ${report.job.market}`}
            {report.job.seniority && ` · ${report.job.seniority}`}
          </p>
          {report.resume && (
            <p className="mt-1 text-[11px] text-[#6e7681]">Resume: {report.resume.title}</p>
          )}
        </div>

        {/* Score */}
        <div className="mb-6 flex items-center gap-6 rounded-xl border border-[#30363d] bg-[#161b22] p-6">
          <ScoreRing score={report.score} size={96} threshold={70} />
          <div>
            <p className="text-sm font-semibold text-[#e6edf3]">JD Match Score</p>
            <p className="mt-1 text-[12px] text-[#8b949e]">
              {report.score >= 80
                ? "Strong match — above interview threshold."
                : report.score >= 65
                  ? "Good match — a few gaps to address."
                  : report.score >= 50
                    ? "Moderate match — meaningful gaps present."
                    : "Low match — significant tailoring needed."}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Matched skills */}
          {breakdown.matchedSkills?.length > 0 && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#6e7681]">
                Matched Skills ({breakdown.matchedSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {breakdown.matchedSkills.map((s: string) => (
                  <span
                    key={s}
                    className="rounded-md border border-[#3fb950]/30 bg-[#3fb950]/10 px-2 py-0.5 text-[10px] font-medium text-[#3fb950]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {breakdown.missingSkills?.length > 0 && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#6e7681]">
                Missing Skills ({breakdown.missingSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {breakdown.missingSkills.map((s: string) => (
                  <span
                    key={s}
                    className="rounded-md border border-[#f85149]/30 bg-[#f85149]/10 px-2 py-0.5 text-[10px] font-medium text-[#f85149]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Seniority */}
          {breakdown.seniority && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6e7681]">
                Seniority Fit
              </p>
              <Bar value={breakdown.seniority.ok ? 100 : 40} />
              <p className="mt-1.5 text-[11px] text-[#8b949e]">{breakdown.seniority.verdict}</p>
            </div>
          )}

          {/* Location risk */}
          {breakdown.locationRisk && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6e7681]">
                Location / Visa Risk
              </p>
              <Bar
                value={breakdown.locationRisk.level === "low" ? 90 : breakdown.locationRisk.level === "medium" ? 60 : 25}
                tone={breakdown.locationRisk.level === "high" ? "danger" : breakdown.locationRisk.level === "medium" ? "warn" : "accent"}
              />
              <p className="mt-1.5 text-[11px] text-[#8b949e]">{breakdown.locationRisk.note}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 rounded-xl border border-[#3fb950]/20 bg-[#3fb950]/5 px-5 py-4 text-center">
          <p className="text-sm font-medium text-[#3fb950]">Want to run your own match reports?</p>
          <p className="mt-1 text-xs text-[#8b949e]">
            CareerForge scores your resume against any job description, blocks weak applications, and
            helps you tailor your CV for the TH / MY / SG / Remote market.
          </p>
          <Link
            href="/register"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#238636] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3fb950]"
          >
            Try CareerForge free →
          </Link>
        </div>
      </div>
    </div>
  );
}
