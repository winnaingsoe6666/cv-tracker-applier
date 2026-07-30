"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Badge, inputCls, btnPrimary, btnSecondary } from "@/components/ui";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Collaborator {
  id: string;
  collaboratorEmail: string;
  role: string;
  createdAt: string | Date;
}

interface CollabNote {
  id: string;
  content: string;
  createdAt: string | Date;
  author: { name: string; email: string };
  application?: { id: string; status: string; job?: { title: string; company: string } };
}

/* ── Collaborators Panel ───────────────────────────────────────────────────── */

export function CollaboratorsPanel({ initial }: { initial: Collaborator[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/collaborate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    setLoading(false);
    if (res.ok) {
      const collab = await res.json();
      setList((prev) => [{ ...collab, createdAt: new Date().toISOString() }, ...prev]);
      setEmail("");
      setMsg({ text: "Invited!", ok: true });
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ text: d.error ?? "Failed", ok: false });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  async function remove(id: string) {
    if (!confirm("Remove this collaborator?")) return;
    const res = await fetch(`/api/collaborate?id=${id}`, { method: "DELETE" });
    if (res.ok) setList((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <Card>
      <CardTitle sub="Invite recruiters or teammates to view/edit your pipeline">Collaborators</CardTitle>

      <form onSubmit={invite} className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-[11px] font-medium text-faint">Email</label>
          <input
            className={inputCls}
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-faint">Role</label>
          <select
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")}
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>
        <button className={btnPrimary} disabled={loading}>
          {loading ? "Inviting…" : "Invite"}
        </button>
        {msg && <span className={`text-xs ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.text}</span>}
      </form>

      {list.length === 0 ? (
        <p className="text-xs text-muted py-4 text-center">No collaborators yet. Invite someone to get started.</p>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-edge bg-surface2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.collaboratorEmail}</p>
                <p className="text-[11px] text-faint">Invited {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.role === "EDITOR" ? "accent" : "neutral"}>{c.role}</Badge>
                <button
                  onClick={() => remove(c.id)}
                  className="rounded-md px-2 py-1 text-[11px] text-danger transition hover:bg-danger/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Notes Panel ───────────────────────────────────────────────────────────── */

export function NotesPanel({ initial }: { initial: CollabNote[] }) {
  const [notes, setNotes] = useState(initial);

  return (
    <Card>
      <CardTitle sub="Recent notes from collaborators on your applications">Collaborator Notes</CardTitle>
      {notes.length === 0 ? (
        <p className="text-xs text-muted py-4 text-center">No notes yet. Notes appear here when collaborators comment on your applications.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-edge bg-surface2 px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{n.author.name || n.author.email}</span>
                <span className="text-[10px] text-faint">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              {n.application && (
                <p className="mb-1 text-[11px] text-accent">
                  {n.application.job?.title} @ {n.application.job?.company}
                  <span className="ml-1.5 text-faint">({n.application.status})</span>
                </p>
              )}
              <p className="text-sm text-muted whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
