import { requireUser } from "@/lib/session";
import { PLANS, Plan } from "@/lib/constants";
import { Card, CardTitle, Badge } from "@/components/ui";
import { SettingsClient, ExtensionTokenPanel } from "./settings-client";

export default async function SettingsPage() {
  const user = await requireUser();
  const plan = PLANS[(user.plan as Plan) ?? "FREE"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Profile, plan, and quality gate thresholds.</p>
      </div>

      {/* Plan card */}
      <Card>
        <CardTitle>Plan</CardTitle>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge tone={user.plan === "PRO" ? "accent" : "neutral"}>{plan.label}</Badge>
              {user.plan === "FREE" && (
                <span className="text-xs text-muted">Free tier limits apply</span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <PlanLimit label="Resumes" value={plan.maxResumes} />
              <PlanLimit label="Jobs" value={plan.maxJobs} />
              <PlanLimit label="Letters/mo" value={plan.maxLettersPerMonth} />
            </div>
          </div>
          {user.plan === "FREE" && (
            <div className="shrink-0 rounded-xl border border-accent/30 bg-accent/5 p-4 text-right">
              <p className="text-xs font-semibold text-accent">Upgrade to Pro</p>
              <p className="mt-1 text-[11px] text-muted">
                50 resumes · 1000 jobs · Unlimited letters
              </p>
              <button
                className="mt-3 w-full rounded-lg bg-accent-dim px-3 py-1.5 text-xs font-semibold text-[#06281c] transition hover:bg-accent"
                disabled
                title="Stripe billing coming soon"
              >
                Coming soon
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Profile + thresholds — editable */}
      <SettingsClient
        user={{
          name: user.name,
          email: user.email,
          headline: user.headline ?? "",
          phone: user.phone ?? "",
          linkedin: user.linkedin ?? "",
          location: user.location ?? "",
          gateAtsThreshold: user.gateAtsThreshold,
          gateMatchThreshold: user.gateMatchThreshold,
        }}
      />

      {/* Extension token — separate from save form */}
      <ExtensionTokenPanel
        hasToken={!!user.apiToken}
        tokenSuffix={user.apiToken ? user.apiToken.slice(-8) : null}
      />
    </div>
  );
}

function PlanLimit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-edge bg-surface2 px-3 py-2 text-center">
      <p className="text-base font-bold text-foreground">{value >= 1000 ? "∞" : value}</p>
      <p className="text-[10px] text-faint">{label}</p>
    </div>
  );
}
