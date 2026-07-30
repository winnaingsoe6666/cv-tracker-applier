import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { llmEnabled } from "@/lib/llm";
import type { ParsedResume } from "@/lib/parse";
import type { AtsBreakdown, Severity } from "@/lib/scoring/ats";
import { Badge, Bar, Card, CardTitle, ScoreRing, scoreTone } from "@/components/ui";
import { CritiquePanel, DeleteResumeButton } from "@/components/resume-actions";

const severityTone: Record<Severity, "danger" | "warn" | "accent"> = {
  critical: "danger",
  warning: "warn",
  pass: "accent",
};

const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  warning: "Improve",
  pass: "Pass",
};

export default async function ResumeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const resume = await db.resume.findFirst({
    where: { id, userId: user.id },
    include: { atsReports: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!resume) notFound();

  const parsed = JSON.parse(resume.parsedJson) as ParsedResume;
  const report = resume.atsReports[0];
  const breakdown = report ? (JSON.parse(report.breakdownJson) as AtsBreakdown) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/resumes" className="text-xs text-muted hover:text-accent">
            ← Resumes
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{resume.title}</h1>
          <p className="mt-1 text-xs text-faint">
            {resume.sourceFileName ?? "pasted text"} · analyzed {new Date(resume.createdAt).toLocaleString()}
          </p>
        </div>
        <DeleteResumeButton id={resume.id} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center">
          <ScoreRing score={report?.score ?? 0} size={128} label="ATS Score" />
          <p className="mt-3 max-w-52 text-center text-xs text-muted">
            {report && report.score >= 75
              ? "Strong. This resume parses cleanly and reads with impact."
              : report && report.score >= 55
                ? "Fixable. Address the critical findings below before applying."
                : "At risk. Most ATS filters would rank this low — work the fixes below."}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle sub="Weighted contribution of each dimension to the total score.">Score breakdown</CardTitle>
          <div className="space-y-3">
            {breakdown?.categories.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {c.category} <span className="text-faint">· {c.weight}%</span>
                  </span>
                  <span className="text-muted">{c.score}/100</span>
                </div>
                <Bar value={c.score} tone={scoreTone(c.score)} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub="Every point lost has a concrete fix. Work top-down.">Findings</CardTitle>
          <ul className="space-y-3">
            {breakdown?.findings.map((f, i) => (
              <li key={i} className="rounded-lg border border-edge bg-surface2 p-3">
                <div className="flex items-center gap-2">
                  <Badge tone={severityTone[f.severity]}>{severityLabel[f.severity]}</Badge>
                  <span className="text-xs font-medium text-muted">{f.category}</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{f.message}</p>
                {f.fix && <p className="mt-1 text-xs leading-relaxed text-muted">Fix: {f.fix}</p>}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Parsed profile</CardTitle>
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={parsed.name} />
              <Row label="Email" value={parsed.email} />
              <Row label="Phone" value={parsed.phone} />
              <Row label="LinkedIn" value={parsed.linkedin} />
              <Row label="Experience" value={parsed.yearsOfExperience ? `~${parsed.yearsOfExperience} years` : null} />
              <Row label="Words" value={String(parsed.wordCount)} />
              <Row
                label="Quantified bullets"
                value={`${parsed.quantifiedBullets}/${parsed.bulletCount}`}
              />
            </dl>
          </Card>
          <Card>
            <CardTitle sub={`${parsed.skills.length} recognizable skills detected.`}>Skills</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {parsed.skills.map((s) => (
                <Badge key={s} tone="info">
                  {s}
                </Badge>
              ))}
              {parsed.skills.length === 0 && <p className="text-xs text-faint">No known skills detected.</p>}
            </div>
          </Card>
          <Card>
            <CardTitle>Recruiter critique</CardTitle>
            <CritiquePanel resumeId={resume.id} enabled={llmEnabled()} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`truncate text-right ${value ? "text-foreground" : "text-danger"}`}>{value ?? "not found"}</dd>
    </div>
  );
}
