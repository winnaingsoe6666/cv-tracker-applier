import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PLANS, Plan } from "@/lib/constants";
import { Badge, EmptyState, ScoreRing } from "@/components/ui";
import { ResumeUploader } from "@/components/resume-uploader";
import { UpgradeBanner } from "@/components/upgrade-banner";

export default async function ResumesPage() {
  const user = await requireUser();
  const resumes = await db.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { atsReports: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const limit = PLANS[(user.plan as Plan) ?? "FREE"].maxResumes;
  const baseCount = resumes.filter((r) => r.isBase).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumes</h1>
          <p className="mt-1 text-sm text-muted">
            Base resumes and job-tailored variants. {baseCount}/{limit} base slots used.
          </p>
        </div>
      </div>

      <ResumeUploader />

      <UpgradeBanner resource="resumes" used={baseCount} limit={limit} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {resumes.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState
              title="No resumes yet"
              hint="Upload your current CV to get an instant ATS score with the exact fixes that raise your interview rate."
            />
          </div>
        )}
        {resumes.map((r) => {
          const score = r.atsReports[0]?.score ?? null;
          return (
            <Link
              key={r.id}
              href={`/resumes/${r.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-surface p-5 transition hover:border-accent/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{r.title}</p>
                  {!r.isBase && <Badge tone="info">variant</Badge>}
                </div>
                <p className="mt-1 text-xs text-faint">
                  {r.sourceFileName ?? "pasted text"} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              {score !== null && <ScoreRing score={score} size={64} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
