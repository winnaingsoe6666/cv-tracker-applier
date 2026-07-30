"use client";

import { useState } from "react";
import { Card, CardTitle, Badge } from "@/components/ui";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalResumes: number;
  totalApplications: number;
  planDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  extensionJobs: number;
}

interface RecentEvent {
  id: string;
  type: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
  jobTitle: string;
  jobCompany: string;
  userName: string;
  userEmail: string;
}

const STATUS_COLORS: Record<string, string> = {
  SAVED: "neutral",
  TAILORING: "info",
  READY: "info",
  APPLIED: "accent",
  SCREENING: "accent",
  INTERVIEW: "accent",
  OFFER: "accent",
  REJECTED: "danger",
};

export function AdminClient({
  stats,
  recentEvents,
}: {
  stats: AdminStats;
  recentEvents: RecentEvent[];
}) {
  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="Jobs" value={stats.totalJobs} />
        <StatCard label="Resumes" value={stats.totalResumes} />
        <StatCard label="Applications" value={stats.totalApplications} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Plan distribution */}
        <Card>
          <CardTitle>Plan Distribution</CardTitle>
          <div className="space-y-3">
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge tone={plan === "PRO" ? "accent" : "neutral"}>{plan}</Badge>
                </div>
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
            {Object.keys(stats.planDistribution).length === 0 && (
              <p className="text-xs text-faint">No users yet.</p>
            )}
          </div>
        </Card>

        {/* Application status breakdown */}
        <Card>
          <CardTitle>Applications by Status</CardTitle>
          <div className="space-y-2">
            {Object.entries(stats.statusDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs">
                  <Badge tone={(STATUS_COLORS[status] as "neutral" | "info" | "accent" | "danger") ?? "neutral"}>
                    {status}
                  </Badge>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
              ))}
            {Object.keys(stats.statusDistribution).length === 0 && (
              <p className="text-xs text-faint">No applications yet.</p>
            )}
          </div>
        </Card>

        {/* Extension usage */}
        <Card>
          <CardTitle sub="Jobs pushed via the Chrome extension">Extension Usage</CardTitle>
          <div className="py-4 text-center">
            <span className="text-3xl font-bold text-foreground">{stats.extensionJobs}</span>
            <p className="mt-1 text-xs text-muted">jobs ingested via extension</p>
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardTitle sub="Last 20 pipeline events">Recent Activity</CardTitle>
          <div className="max-h-80 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="py-4 text-center text-xs text-faint">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface2 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {e.jobTitle} at {e.jobCompany}
                      </p>
                      <p className="text-[11px] text-faint">
                        {e.userName} ({e.userEmail})
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-muted">
                        {e.fromStatus} → {e.toStatus}
                      </p>
                      <p className="text-[10px] text-faint">
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5">
      <span className="text-3xl font-bold text-foreground">{value}</span>
      <span className="mt-1 block text-xs font-medium text-faint uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
