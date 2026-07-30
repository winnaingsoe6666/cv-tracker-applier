"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETS, SENIORITIES } from "@/lib/constants";
import { btnPrimary, btnSecondary, inputCls } from "@/components/ui";

export function JobForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    market: "REMOTE",
    url: "",
    source: "",
    salaryMin: "",
    salaryMax: "",
    currency: "",
    seniority: "",
    description: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : null,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : null,
        seniority: form.seniority || null,
        url: form.url || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save the job.");
      return;
    }
    router.push(`/jobs/${data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button className={btnPrimary} onClick={() => setOpen(true)}>
        + Track a job
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-edge bg-surface p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputCls} placeholder="Job title *" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        <input className={inputCls} placeholder="Company *" value={form.company} onChange={(e) => set("company", e.target.value)} required />
        <input className={inputCls} placeholder="Location (e.g. Bangkok, hybrid)" value={form.location} onChange={(e) => set("location", e.target.value)} />
        <select className={inputCls} value={form.market} onChange={(e) => set("market", e.target.value)}>
          {MARKETS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input className={inputCls} placeholder="Job post URL" value={form.url} onChange={(e) => set("url", e.target.value)} />
        <input className={inputCls} placeholder="Source (LinkedIn, JobStreet, JobsDB…)" value={form.source} onChange={(e) => set("source", e.target.value)} />
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Salary min" type="number" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
          <input className={inputCls} placeholder="Salary max" type="number" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
          <input className={`${inputCls} max-w-24`} placeholder="THB" value={form.currency} onChange={(e) => set("currency", e.target.value)} />
        </div>
        <select className={inputCls} value={form.seniority} onChange={(e) => set("seniority", e.target.value)}>
          <option value="">Seniority (auto-detect)</option>
          {SENIORITIES.map((s) => (
            <option key={s} value={s}>
              {s[0] + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className={`${inputCls} mt-3 min-h-44 font-mono text-xs`}
        placeholder="Paste the full job description here * — the match engine reads requirements, skills, seniority and eligibility from it."
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        required
      />
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button className={btnPrimary} disabled={loading}>
          {loading ? "Saving…" : "Save & analyze"}
        </button>
        <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
