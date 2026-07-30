"use client";

import { useState } from "react";

const ROLE_FAMILIES = [
  { value: "", label: "Untagged" },
  { value: "BACKEND", label: "Backend" },
  { value: "FULLSTACK", label: "Full-Stack" },
  { value: "DATA", label: "Data / ML" },
  { value: "DEVOPS", label: "DevOps / SRE" },
  { value: "MOBILE", label: "Mobile" },
  { value: "OTHER", label: "Other" },
] as const;

export function RoleFamilyTagger({
  resumeId,
  currentRoleFamily,
}: {
  resumeId: string;
  currentRoleFamily: string | null;
}) {
  const [selected, setSelected] = useState(currentRoleFamily ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/resumes/${resumeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleFamily: selected || null }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ text: "Saved", ok: true });
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ text: d.error ?? "Failed", ok: false });
    }
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <div className="flex items-center gap-3">
      <select
        className="flex-1 rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {ROLE_FAMILIES.map((rf) => (
          <option key={rf.value} value={rf.value}>
            {rf.label}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving || selected === (currentRoleFamily ?? "")}
        className="shrink-0 rounded-lg border border-edge bg-surface2 px-3 py-2 text-xs font-medium text-foreground transition hover:border-accent/50 hover:text-accent disabled:opacity-40"
      >
        {saving ? "…" : "Save"}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.text}</span>
      )}
    </div>
  );
}
