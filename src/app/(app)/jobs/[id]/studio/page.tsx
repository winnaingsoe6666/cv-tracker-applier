import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { MARKETS, STATUS_LABELS, PipelineStatus } from "@/lib/constants";
import { Badge } from "@/components/ui";
import { StudioClient } from "./studio-client";

export default async function JobStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [job, resumes] = await Promise.all([
    db.job.findFirst({
      where: { id, userId: user.id },
      include: {
        applications: { take: 1 },
        coverLetters: { orderBy: { updatedAt: "desc" } },
      },
    }),
    db.resume.findMany({
      where: { userId: user.id },
      orderBy: [{ isBase: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true },
    }),
  ]);

  if (!job) notFound();

  const application = job.applications[0] ?? null;
  const market = MARKETS.find((m) => m.value === job.market)?.label ?? job.market;

  const statusTone: Record<string, "neutral" | "info" | "accent" | "warn" | "danger"> = {
    SAVED: "neutral", TAILORING: "info", READY: "info", APPLIED: "accent",
    SCREENING: "accent", INTERVIEW: "accent", OFFER: "accent", REJECTED: "danger",
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link href="/jobs" className="hover:text-foreground transition">Jobs</Link>
        <span>/</span>
        <Link href={`/jobs/${id}`} className="hover:text-foreground transition">{job.title}</Link>
        <span>/</span>
        <span className="text-foreground">Studio</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apply Studio</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{job.company}</span>
            <span className="text-sm text-faint">· {job.title}</span>
            <Badge tone="neutral">{market}</Badge>
            {application && (
              <Badge tone={statusTone[application.status] ?? "neutral"}>
                {STATUS_LABELS[application.status as PipelineStatus] ?? application.status}
              </Badge>
            )}
          </div>
        </div>
        <Link
          href={`/jobs/${id}`}
          className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted transition hover:border-edge-strong hover:text-foreground"
        >
          ← Workbench
        </Link>
      </div>

      {application ? (
        <StudioClient
          jobId={id}
          jobTitle={job.title}
          jobCompany={job.company}
          resumes={resumes}
          existingLetters={job.coverLetters.map((l) => ({
            id: l.id,
            template: l.template,
            content: l.content,
            updatedAt: l.updatedAt.toISOString(),
          }))}
          checklistJson={application.checklistJson}
          applicationId={application.id}
          defaultResumeId={application.resumeId}
        />
      ) : (
        <p className="text-sm text-muted">No application record — try re-creating the job.</p>
      )}
    </div>
  );
}
