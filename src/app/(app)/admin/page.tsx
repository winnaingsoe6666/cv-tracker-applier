import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const user = await requireUser();
  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger/5 py-16 text-center">
          <p className="text-lg font-bold text-danger">Access Denied</p>
          <p className="mt-2 text-sm text-muted">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const [totalUsers, totalJobs, totalResumes, totalApplications] = await Promise.all([
    db.user.count(),
    db.job.count(),
    db.resume.count(),
    db.application.count(),
  ]);

  // Plan distribution
  const planCounts = await db.user.groupBy({
    by: ["plan"],
    _count: { id: true },
  });
  const planDistribution = Object.fromEntries(
    planCounts.map((p) => [p.plan, p._count.id])
  );

  // Applications by status
  const statusCounts = await db.application.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const statusDistribution = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.id])
  );

  // Recent activity (last 20 outcome events)
  const recentEvents = await db.outcomeEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      application: {
        include: {
          job: { select: { title: true, company: true } },
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  // API usage (extension push count)
  const extensionJobs = await db.job.count({
    where: { source: { not: null } },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Platform usage and metering.</p>
      </div>

      <AdminClient
        stats={{
          totalUsers,
          totalJobs,
          totalResumes,
          totalApplications,
          planDistribution,
          statusDistribution,
          extensionJobs,
        }}
        recentEvents={recentEvents.map((e) => ({
          id: e.id,
          type: e.type,
          fromStatus: e.fromStatus,
          toStatus: e.toStatus,
          createdAt: e.createdAt.toISOString(),
          jobTitle: e.application.job.title,
          jobCompany: e.application.job.company,
          userName: e.application.user.name,
          userEmail: e.application.user.email,
        }))}
      />
    </div>
  );
}
