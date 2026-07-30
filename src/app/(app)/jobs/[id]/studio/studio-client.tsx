"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LETTER_TEMPLATES, APPLY_CHECKLIST_ITEMS } from "@/lib/constants";
import { btnPrimary, btnSecondary, btnDanger } from "@/components/ui";

interface Resume {
  id: string;
  title: string;
}

interface ExistingLetter {
  id: string;
  template: string;
  content: string;
  updatedAt: string;
}

interface StudioClientProps {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  resumes: Resume[];
  existingLetters: ExistingLetter[];
  checklistJson: string | null;
  applicationId: string;
  defaultResumeId: string | null;
}

export function StudioClient({
  jobId,
  jobTitle,
  jobCompany,
  resumes,
  existingLetters,
  checklistJson,
  applicationId,
  defaultResumeId,
}: StudioClientProps) {
  const router = useRouter();

  // ── Letter state ──────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState("DIRECT");
  const [selectedResumeId, setSelectedResumeId] = useState(defaultResumeId ?? resumes[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<ExistingLetter | null>(
    existingLetters[0] ?? null
  );
  const [editContent, setEditContent] = useState(activeLetter?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [polished, setPolished] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeLetter) setEditContent(activeLetter.content);
  }, [activeLetter]);

  async function generate() {
    setGenerating(true);
    setGenError(null);
    setPolished(false);
    const res = await fetch(`/api/jobs/${jobId}/letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: selectedTemplate, resumeId: selectedResumeId || null }),
    });
    const data = await res.json().catch(() => ({}));
    setGenerating(false);
    if (!res.ok) {
      setGenError(data.error ?? "Generation failed.");
      return;
    }
    const newLetter: ExistingLetter = {
      id: data.id,
      template: selectedTemplate,
      content: data.content,
      updatedAt: new Date().toISOString(),
    };
    setActiveLetter(newLetter);
    setEditContent(data.content);
    setPolished(data.polished ?? false);
    router.refresh();
  }

  async function saveLetter() {
    if (!activeLetter) return;
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch(`/api/letters/${activeLetter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(null), 2000);
    } else {
      setSaveMsg("Failed to save");
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(editContent);
    setSaveMsg("Copied!");
    setTimeout(() => setSaveMsg(null), 1500);
  }

  // ── Checklist state ───────────────────────────────────────────────────────
  const parsedChecklist: Record<string, boolean> = checklistJson
    ? JSON.parse(checklistJson)
    : {};
  const [checklist, setChecklist] = useState<Record<string, boolean>>(parsedChecklist);
  const [checklistSaving, setChecklistSaving] = useState(false);

  async function toggleCheck(id: string) {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    setChecklistSaving(true);
    await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: updated }),
    });
    setChecklistSaving(false);
  }

  const checkedCount = APPLY_CHECKLIST_ITEMS.filter((item) => checklist[item.id]).length;
  const totalItems = APPLY_CHECKLIST_ITEMS.length;
  const allDone = checkedCount === totalItems;

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"letter" | "checklist">("letter");

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border border-edge bg-surface p-1">
        {(["letter", "checklist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === t ? "bg-surface2 text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t === "letter" ? "Cover Letter Studio" : `Apply Checklist (${checkedCount}/${totalItems})`}
          </button>
        ))}
      </div>

      {/* ── LETTER STUDIO ── */}
      {tab === "letter" && (
        <div className="space-y-4">
          {/* Controls row */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Template picker */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-faint uppercase">
                Template
              </label>
              <div className="space-y-1.5">
                {LETTER_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.value}
                    onClick={() => setSelectedTemplate(tpl.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      selectedTemplate === tpl.value
                        ? "border-accent/50 bg-accent/5 text-foreground"
                        : "border-edge bg-surface2 text-muted hover:border-edge-strong hover:text-foreground"
                    }`}
                  >
                    <p className="text-xs font-semibold">{tpl.label}</p>
                    <p className="mt-0.5 text-[10px] text-faint">{tpl.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Resume + history */}
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-faint uppercase">
                  Resume for context
                </label>
                <select
                  className="w-full rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                  <option value="">None (generic draft)</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={btnPrimary + " w-full"}
                disabled={generating}
                onClick={generate}
              >
                {generating ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Drafting…
                  </>
                ) : existingLetters.length > 0 ? (
                  "Generate new draft"
                ) : (
                  "Generate draft"
                )}
              </button>

              {genError && <p className="text-xs text-danger">{genError}</p>}
            </div>

            {/* Past letters */}
            {existingLetters.length > 0 && (
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-faint uppercase">
                  Past drafts ({existingLetters.length})
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {existingLetters.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setActiveLetter(l)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        activeLetter?.id === l.id
                          ? "border-accent/50 bg-accent/5 text-foreground"
                          : "border-edge bg-surface2 text-muted hover:text-foreground"
                      }`}
                    >
                      <p className="text-xs font-semibold capitalize">{l.template.toLowerCase()}</p>
                      <p className="text-[10px] text-faint">
                        {new Date(l.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Editor */}
          {activeLetter ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wide text-faint uppercase">
                    Editing — {activeLetter.template.toLowerCase()} template
                  </span>
                  {polished && (
                    <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                      AI-polished
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {saveMsg && (
                    <span className="text-[11px] text-accent">{saveMsg}</span>
                  )}
                  <button className={btnSecondary + " py-1.5 text-xs"} onClick={copyToClipboard}>
                    Copy
                  </button>
                  <button
                    className={btnPrimary + " py-1.5 text-xs"}
                    disabled={saving}
                    onClick={saveLetter}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                className="w-full rounded-xl border border-edge bg-surface2 px-4 py-3 font-mono text-xs leading-relaxed text-foreground outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                style={{ minHeight: "420px", resize: "vertical" }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                spellCheck
              />
              <p className="text-[10px] text-faint">
                {editContent.split(/\s+/).filter(Boolean).length} words ·{" "}
                {editContent.length} characters. Slots in [brackets] require your input.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge-strong py-16 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-surface2 text-faint text-lg">
                ✉
              </div>
              <p className="text-sm font-medium text-foreground">No letter drafted yet</p>
              <p className="mt-1 max-w-sm text-xs text-muted">
                Choose a template and click "Generate draft." The engine uses your match report's
                skills and your profile to pre-fill the letter — you review and personalise before
                sending.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── CHECKLIST ── */}
      {tab === "checklist" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              Complete all items before applying. This checklist is auto-saved.
            </p>
            {checklistSaving && (
              <span className="text-[11px] text-faint">Saving…</span>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-muted">{checkedCount} of {totalItems} done</span>
              {allDone && (
                <span className="font-semibold text-accent">Ready to apply ✓</span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(checkedCount / totalItems) * 100}%`,
                  background: allDone ? "var(--accent)" : "var(--info)",
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {APPLY_CHECKLIST_ITEMS.map((item) => {
              const checked = !!checklist[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    checked
                      ? "border-accent/30 bg-accent/5"
                      : "border-edge bg-surface hover:border-edge-strong"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition ${
                      checked
                        ? "border-accent bg-accent text-[#06281c]"
                        : "border-edge-strong bg-surface2 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`text-sm leading-snug ${
                      checked ? "text-muted line-through" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {allDone && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
              <p className="text-sm font-semibold text-accent">All items checked ✓</p>
              <p className="mt-1 text-xs text-muted">
                You&apos;re ready. Go back to the workbench to confirm the gate and mark this as applied.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
