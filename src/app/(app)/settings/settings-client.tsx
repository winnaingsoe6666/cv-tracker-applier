"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnPrimary, btnSecondary, Card, CardTitle, Badge } from "@/components/ui";

interface UserData {
  name: string;
  email: string;
  headline: string;
  phone: string;
  linkedin: string;
  location: string;
  gateAtsThreshold: number;
  gateMatchThreshold: number;
  reminderDays: number;
}

export function SettingsClient({ user }: { user: UserData }) {
  const router = useRouter();
  const [form, setForm] = useState(user);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function setField<K extends keyof UserData>(key: K, value: UserData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        headline: form.headline || null,
        phone: form.phone || null,
        linkedin: form.linkedin || null,
        location: form.location || null,
        gateAtsThreshold: form.gateAtsThreshold,
        gateMatchThreshold: form.gateMatchThreshold,
        reminderDays: form.reminderDays,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ text: "Settings saved", ok: true });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ text: d.error ?? "Failed to save", ok: false });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Profile */}
      <Card>
        <CardTitle>Profile</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-faint">Full name *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-faint">Email (read-only)</label>
            <input className={inputCls + " opacity-50"} value={form.email} disabled />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-faint">Headline</label>
            <input
              className={inputCls}
              placeholder="e.g. Senior Backend Engineer"
              value={form.headline}
              onChange={(e) => setField("headline", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-faint">Location</label>
            <input
              className={inputCls}
              placeholder="e.g. Bangkok, Thailand"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-faint">Phone</label>
            <input
              className={inputCls}
              placeholder="+66 xx xxxx xxxx"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-faint">LinkedIn URL</label>
            <input
              className={inputCls}
              placeholder="https://linkedin.com/in/yourprofile"
              value={form.linkedin}
              onChange={(e) => setField("linkedin", e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Gate thresholds */}
      <Card>
        <CardTitle sub="Applications below these scores trigger the fail banner in the workbench">
          Quality Gate Thresholds
        </CardTitle>
        <div className="space-y-5">
          <ThresholdSlider
            label="ATS Score minimum"
            hint="Parsability, keywords, formatting, impact — aim ≥ 75"
            value={form.gateAtsThreshold}
            onChange={(v) => setField("gateAtsThreshold", v)}
          />
          <ThresholdSlider
            label="JD Match minimum"
            hint="Skills overlap, must-haves, seniority fit — aim ≥ 70"
            value={form.gateMatchThreshold}
            onChange={(v) => setField("gateMatchThreshold", v)}
          />
        </div>
        <p className="mt-3 text-[11px] text-faint">
          These thresholds apply across all jobs. Override is available per-application in the workbench.
        </p>
      </Card>

      {/* Follow-up reminders */}
      <Card>
        <CardTitle sub="Get a reminder when no response after applying">Follow-up Reminders</CardTitle>
        <ThresholdSlider
          label="Reminder interval"
          hint="Days after applying before sending a follow-up reminder email"
          value={form.reminderDays}
          onChange={(v) => setField("reminderDays", v)}
        />
        <p className="mt-3 text-[11px] text-faint">
          A daily cron job checks for stale applications and sends reminder emails via Resend (set <code className="rounded bg-surface2 px-1 py-0.5 font-mono text-[10px]">RESEND_API_KEY</code> in production).
        </p>
      </Card>

      {/* Save row */}
      <div className="flex items-center gap-3">
        <button className={btnPrimary} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.text}</span>
        )}
      </div>
    </form>
  );
}

/** Separate exported component — rendered outside the save-form in page.tsx */
export function ExtensionTokenPanel({
  hasToken,
  tokenSuffix,
}: {
  hasToken: boolean;
  tokenSuffix: string | null;
}) {
  const router = useRouter();
  const [newToken, setNewToken] = useState<string | null>(null); // one-time reveal
  const [currentHasToken, setCurrentHasToken] = useState(hasToken);
  const [currentSuffix, setCurrentSuffix] = useState(tokenSuffix);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function generate() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/extension/token", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      const { token: t } = await res.json();
      setNewToken(t);
      setCurrentHasToken(true);
      setCurrentSuffix(t.slice(-8));
      router.refresh();
    } else {
      setMsg({ text: "Failed to generate token", ok: false });
    }
  }

  async function revoke() {
    if (!confirm("Revoke token? The extension will stop working until you generate a new one.")) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/extension/token", { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      setNewToken(null);
      setCurrentHasToken(false);
      setCurrentSuffix(null);
      setMsg({ text: "Token revoked", ok: true });
      router.refresh();
    } else {
      setMsg({ text: "Failed to revoke", ok: false });
    }
  }

  async function copyToken() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardTitle sub="Connect the CareerForge Chrome extension to push job postings instantly">
        Browser Extension
      </CardTitle>

      {/* Setup instructions */}
      <div className="mb-4 rounded-lg border border-info/20 bg-info/5 px-4 py-3">
        <p className="text-xs font-semibold text-info mb-1.5">Setup (3 steps)</p>
        <ol className="text-[11px] text-muted space-y-1 list-decimal list-inside">
          <li>Generate an API token below</li>
          <li>
            Load the{" "}
            <code className="rounded bg-surface2 px-1 py-0.5 font-mono text-[10px]">extension/</code>{" "}
            folder as an unpacked Chrome extension (chrome://extensions → Developer mode → Load unpacked)
          </li>
          <li>Click the extension icon on any job page → paste token → push JD to CareerForge</li>
        </ol>
      </div>

      <div className="space-y-3">
        {/* Token display */}
        {currentHasToken ? (
          <div>
            <p className="mb-1 text-[11px] font-medium text-faint">API Token</p>
            {newToken ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-accent/40 bg-surface2 px-3 py-2 font-mono text-xs text-accent break-all select-all">
                  {newToken}
                </code>
                <button
                  type="button"
                  onClick={copyToken}
                  className="shrink-0 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/20"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface2 px-3 py-2">
                <code className="flex-1 font-mono text-xs text-muted">
                  cf_••••••••••••••••••••••••{currentSuffix ?? "••••••••"}
                </code>
                <span className="shrink-0 text-[10px] text-accent font-medium">● Active</span>
              </div>
            )}
            {newToken && (
              <p className="mt-1.5 text-[11px] text-warn">
                ⚠ Copy this token now — it won&apos;t be shown again after you leave this page.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-edge-strong px-4 py-4 text-center">
            <p className="text-xs text-muted">No token generated yet</p>
            <p className="mt-0.5 text-[11px] text-faint">Generate one to connect the Chrome extension</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!currentHasToken ? (
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className={btnPrimary}
            >
              {loading ? "Generating…" : "Generate token"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className={btnSecondary}
              >
                {loading ? "…" : "Regenerate"}
              </button>
              <button
                type="button"
                onClick={revoke}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/20 disabled:opacity-40"
              >
                Revoke
              </button>
            </>
          )}
          {msg && (
            <span className={`text-xs ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.text}</span>
          )}
        </div>

        {/* Supported boards */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] text-faint mr-1">Supported:</span>
          {["LinkedIn", "JobStreet", "JobsDB", "Indeed", "Seek", "Glassdoor", "+ generic"].map((s) => (
            <span key={s} className="rounded-md border border-edge bg-surface2 px-2 py-0.5 text-[10px] text-faint">
              {s}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Plan Card (Stripe upgrade / manage) ──────────────────────────────────────

export function PlanCardClient({
  plan,
  planLabel,
  maxResumes,
  maxJobs,
  maxLetters,
  hasStripeCustomer,
  upgraded,
}: {
  plan: "FREE" | "PRO";
  planLabel: string;
  maxResumes: number;
  maxJobs: number;
  maxLetters: number;
  hasStripeCustomer: boolean;
  upgraded: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(
    upgraded ? { text: "Upgrade successful! Welcome to Pro.", ok: true } : null
  );

  async function handleUpgrade() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMsg({ text: data.error ?? "Failed to start checkout.", ok: false });
        setLoading(false);
      }
    } catch {
      setMsg({ text: "Network error.", ok: false });
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMsg({ text: data.error ?? "Failed to open portal.", ok: false });
        setLoading(false);
      }
    } catch {
      setMsg({ text: "Network error.", ok: false });
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Plan</CardTitle>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone={plan === "PRO" ? "accent" : "neutral"}>{planLabel}</Badge>
            {plan === "FREE" && (
              <span className="text-xs text-muted">Free tier limits apply</span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <PlanLimit label="Resumes" value={maxResumes} />
            <PlanLimit label="Jobs" value={maxJobs} />
            <PlanLimit label="Letters/mo" value={maxLetters} />
          </div>
        </div>

        {plan === "FREE" ? (
          <div className="shrink-0 rounded-xl border border-accent/30 bg-accent/5 p-4 text-right">
            <p className="text-xs font-semibold text-accent">Upgrade to Pro</p>
            <p className="mt-1 text-[11px] text-muted">
              50 resumes · 1000 jobs · Unlimited letters
            </p>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="mt-3 w-full rounded-lg bg-accent-dim px-3 py-1.5 text-xs font-semibold text-[#06281c] transition hover:bg-accent disabled:opacity-50"
            >
              {loading ? "Redirecting…" : "Upgrade now"}
            </button>
          </div>
        ) : (
          <div className="shrink-0 rounded-xl border border-accent/30 bg-accent/5 p-4 text-right">
            <p className="text-xs font-semibold text-accent">Pro Plan</p>
            <p className="mt-1 text-[11px] text-muted">
              50 resumes · 1000 jobs · Unlimited letters
            </p>
            {hasStripeCustomer && (
              <button
                onClick={handleManage}
                disabled={loading}
                className="mt-3 w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
              >
                {loading ? "Opening…" : "Manage subscription"}
              </button>
            )}
          </div>
        )}
      </div>
      {msg && (
        <p className={`mt-3 text-xs ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.text}</p>
      )}
    </Card>
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

function ThresholdSlider({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const color = value >= 75 ? "var(--accent)" : value >= 55 ? "var(--warn)" : "var(--danger)";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-faint">{hint}</p>
        </div>
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-[var(--accent)]"
        style={{ accentColor: color }}
      />
      <div className="mt-1 flex justify-between text-[10px] text-faint">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ─── Profile Visibility (public profile) ─────────────────────────────────────

export function ProfileVisibility({
  username: initialUsername,
  profilePublic: initialPublic,
}: {
  username: string;
  profilePublic: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username || null, profilePublic: isPublic }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ text: "Saved", ok: true });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ text: d.error ?? "Failed", ok: false });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  const profileUrl = username ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${username}` : "";

  return (
    <Card>
      <CardTitle sub="Let recruiters find your profile">Public Profile</CardTitle>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-faint">Username</label>
          <input
            className={inputCls}
            placeholder="e.g. john-doe"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
          <p className="mt-1 text-[11px] text-faint">3–30 chars, lowercase letters, numbers, hyphens only.</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Make profile public</p>
            <p className="text-[11px] text-faint">When enabled, anyone with the link can view your profile.</p>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`relative h-6 w-11 rounded-full transition ${isPublic ? "bg-accent" : "bg-surface2"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${isPublic ? "left-5.5" : "left-0.5"}`} />
          </button>
        </div>
        {isPublic && profileUrl && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
            <p className="text-[11px] text-faint">Your public profile:</p>
            <p className="text-xs font-medium text-accent break-all">{profileUrl}</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? "Saving…" : "Save"}
          </button>
          {msg && <span className={`text-xs ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.text}</span>}
        </div>
      </div>
    </Card>
  );
}
