import { requireUser } from "@/lib/session";
import { PLANS, Plan } from "@/lib/constants";
import { Card, CardTitle, Badge } from "@/components/ui";
import { SettingsClient, ExtensionTokenPanel, PlanCardClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await requireUser();
  const plan = PLANS[(user.plan as Plan) ?? "FREE"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Profile, plan, and quality gate thresholds.</p>
      </div>

      {/* Plan card — interactive upgrade/manage */}
      <PlanCardClient
        plan={user.plan as Plan}
        planLabel={plan.label}
        maxResumes={plan.maxResumes}
        maxJobs={plan.maxJobs}
        maxLetters={plan.maxLettersPerMonth}
        hasStripeCustomer={!!user.stripeCustomerId}
        upgraded={false}
      />

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
          reminderDays: user.reminderDays,
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

