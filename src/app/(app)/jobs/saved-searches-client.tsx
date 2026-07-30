"use client";

import { useState } from "react";
import { Card, CardTitle, Badge, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

interface SavedSearch {
  id: string;
  label: string;
  query: string;
  market: string | null;
  seniority: string | null;
  active: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
}

export function SavedSearchesClient({ initial }: { initial: SavedSearch[] }) {
  const [searches, setSearches] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", query: "", market: "" });
  const [saving, setSaving] = useState(false);

  async function create() {
    setSaving(true);
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const s = await res.json();
      setSearches([s, ...searches]);
      setForm({ label: "", query: "", market: "" });
      setShowForm(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
    setSearches(searches.filter((s) => s.id !== id));
  }

  return (
    <Card>
      <CardTitle sub="Get daily email alerts when jobs match your criteria">Saved Searches</CardTitle>
      {searches.length === 0 && !showForm && (
        <p className="text-xs text-muted">No saved searches yet. Save a search from the jobs list to get alerts.</p>
      )}
      <div className="space-y-2">
        {searches.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface2 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{s.label}</p>
              <p className="text-[11px] text-faint">Query: {s.query}{s.market ? ` · ${s.market}` : ""}</p>
            </div>
            <button onClick={() => remove(s.id)} className="shrink-0 text-[11px] text-danger hover:underline">Remove</button>
          </div>
        ))}
      </div>
      {showForm ? (
        <div className="mt-3 space-y-2">
          <input className={inputCls} placeholder="Label (e.g. Senior React roles)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input className={inputCls} placeholder="Keywords (e.g. React TypeScript)" value={form.query} onChange={(e) => setForm({ ...form, query: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={create} disabled={saving || !form.label || !form.query} className={btnPrimary}>{saving ? "…" : "Save search"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className={btnSecondary + " mt-3"}>+ New saved search</button>
      )}
    </Card>
  );
}
