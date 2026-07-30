import Link from "next/link";

interface UpgradeBannerProps {
  resource: "resumes" | "jobs" | "letters";
  used: number;
  limit: number;
}

const resourceLabel = {
  resumes: "resume",
  jobs: "tracked job",
  letters: "cover letter",
};

export function UpgradeBanner({ resource, used, limit }: UpgradeBannerProps) {
  const atLimit = used >= limit;
  const nearLimit = used >= limit * 0.8;

  if (!nearLimit) return null;

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
        atLimit
          ? "border-danger/30 bg-danger/5"
          : "border-warn/30 bg-warn/5"
      }`}
    >
      <div>
        <p className={`text-xs font-semibold ${atLimit ? "text-danger" : "text-warn"}`}>
          {atLimit
            ? `Free plan limit reached (${limit} ${resourceLabel[resource]}s)`
            : `Approaching limit — ${used} / ${limit} ${resourceLabel[resource]}s used`}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          Upgrade to Pro for unlimited access to all features.
        </p>
      </div>
      <Link
        href="/settings"
        className="shrink-0 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
      >
        View plans →
      </Link>
    </div>
  );
}
