import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ScoreRing, Badge, Card, CardTitle } from "@/components/ui";
import type { ParsedResume } from "@/lib/parse";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username, profilePublic: true },
    include: {
      resumes: {
        where: { isBase: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { atsReports: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!user) notFound();

  const resume = user.resumes[0] ?? null;
  const parsed = resume ? (JSON.parse(resume.parsedJson) as ParsedResume) : null;
  const atsScore = resume?.atsReports[0]?.score ?? null;

  const appCount = await db.application.count({ where: { userId: user.id } });
  const interviewCount = await db.application.count({
    where: { userId: user.id, status: { in: ["INTERVIEW", "OFFER"] } },
  });

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e6edf3]">
      <div className="border-b border-[#30363d] bg-[#161b22] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#238636] text-sm font-bold text-white">C</div>
            <span className="font-semibold tracking-tight">CareerForge</span>
          </div>
          <Link href="/login" className="rounded-lg border border-[#238636]/50 bg-[#238636]/10 px-3 py-1.5 text-xs font-medium text-[#3fb950] transition hover:bg-[#238636]/20">
            Sign in →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          {user.headline && <p className="mt-1 text-sm text-[#8b949e]">{user.headline}</p>}
          {user.location && <p className="mt-1 text-xs text-[#6e7681]">📍 {user.location}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {atsScore !== null && (
            <Card className="flex flex-col items-center justify-center">
              <ScoreRing score={atsScore} size={96} label="ATS Score" />
              <p className="mt-2 text-xs text-[#8b949e]">Resume readiness</p>
            </Card>
          )}

          <Card>
            <CardTitle>Activity</CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#8b949e]">Applications tracked</span><span className="font-bold">{appCount}</span></div>
              <div className="flex justify-between"><span className="text-[#8b949e]">Interviews</span><span className="font-bold text-[#3fb950]">{interviewCount}</span></div>
            </div>
          </Card>
        </div>

        {parsed && parsed.skills.length > 0 && (
          <Card className="mt-5">
            <CardTitle>Skills</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {parsed.skills.map((s) => (
                <Badge key={s} tone="info">{s}</Badge>
              ))}
            </div>
          </Card>
        )}

        {user.linkedin && (
          <div className="mt-6 text-center">
            <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#238636] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3fb950]">
              Contact on LinkedIn →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
