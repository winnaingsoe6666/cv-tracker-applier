"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, btnSecondary, inputCls } from "@/components/ui";

export function ResumeUploader() {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let res: Response;
    if (mode === "file") {
      if (!file) {
        setError("Choose a PDF, DOCX or TXT file.");
        setLoading(false);
        return;
      }
      const form = new FormData();
      form.set("file", file);
      form.set("title", title);
      res = await fetch("/api/resumes", { method: "POST", body: form });
    } else {
      res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text }),
      });
    }
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    router.push(`/resumes/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-edge bg-surface p-5">
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setMode("file")} className={mode === "file" ? btnPrimary : btnSecondary}>
          Upload file
        </button>
        <button type="button" onClick={() => setMode("paste")} className={mode === "paste" ? btnPrimary : btnSecondary}>
          Paste text
        </button>
      </div>
      <div className="space-y-3">
        <input
          className={inputCls}
          placeholder="Resume title (e.g. Backend Engineer — base)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {mode === "file" ? (
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface2 file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-edge"
          />
        ) : (
          <textarea
            className={`${inputCls} min-h-48 font-mono text-xs`}
            placeholder="Paste your full resume text here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        <button className={btnPrimary} disabled={loading}>
          {loading ? "Analyzing…" : "Analyze resume"}
        </button>
        <p className="text-[11px] text-faint">PDF, DOCX or TXT. Parsed and scored instantly — nothing leaves your account.</p>
      </div>
    </form>
  );
}
