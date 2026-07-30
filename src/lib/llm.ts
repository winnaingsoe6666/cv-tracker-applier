// Optional LLM enrichment layer. The app is fully functional without a key —
// deterministic engines always run first; this only upgrades the output.
// No chat UI anywhere: results come back as structured text into report cards.

export function llmEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function complete(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_tokens: 900,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/** Polish a deterministic letter draft using the real resume + JD. Returns null if LLM unavailable. */
export async function polishLetter(draft: string, resumeText: string, jobDescription: string): Promise<string | null> {
  return complete(
    "You are a senior international tech recruiter. Rewrite the cover letter draft by replacing every [bracketed] placeholder with specific, truthful content taken ONLY from the resume. Keep it under 280 words, professional, concrete, zero clichés ('passionate', 'team player'). Return only the letter text.",
    `RESUME:\n${resumeText.slice(0, 6000)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 4000)}\n\nDRAFT:\n${draft}`
  );
}

/** Recruiter critique: 4-6 sharp, specific observations. Returns null if LLM unavailable. */
export async function recruiterCritique(resumeText: string, jobDescription?: string): Promise<string | null> {
  return complete(
    "You are a blunt, elite tech recruiter reviewing a resume" +
      (jobDescription ? " against a specific job description" : "") +
      ". Return 4-6 numbered findings. Each: one sentence naming the exact problem (quote the resume where possible) + one sentence with the concrete fix. No praise padding, no generic advice.",
    `RESUME:\n${resumeText.slice(0, 6000)}` + (jobDescription ? `\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 4000)}` : "")
  );
}
