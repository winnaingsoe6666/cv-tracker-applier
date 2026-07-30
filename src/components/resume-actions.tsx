"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnDanger, btnSecondary } from "@/components/ui";

export function DeleteResumeButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={btnDanger}
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this resume and all its reports?")) return;
        setBusy(true);
        await fetch(`/api/resumes/${id}`, { method: "DELETE" });
        router.push("/resumes");
        router.refresh();
      }}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}

export function CritiquePanel({ resumeId, enabled }: { resumeId: string; enabled: boolean }) {
  const [critique, setCritique] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <p className="text-xs text-faint">
        Recruiter critique (LLM-enhanced) is available once an OPENAI_API_KEY is configured on the server. The
        deterministic ATS analysis above is always active.
      </p>
    );
  }

  return (
    <div>
      {!critique && (
        <button
          className={btnSecondary}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const res = await fetch(`/api/resumes/${resumeId}/critique`, { method: "POST" });
            const data = await res.json().catch(() => ({}));
            setBusy(false);
            if (!res.ok) {
              setError(data.error ?? "Critique failed.");
              return;
            }
            setCritique(data.critique);
          }}
        >
          {busy ? "Reviewing…" : "Run recruiter critique"}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {critique && <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{critique}</div>}
    </div>
  );
}
