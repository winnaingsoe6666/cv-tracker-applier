export interface Worthiness {
  score: number; // 0-100 — is this job worth an application slot?
  notes: { tone: "good" | "bad" | "neutral"; text: string }[];
}

/** Heuristics that stop users wasting applications on low-quality postings. */
export function scoreWorthiness(job: {
  description: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  url?: string | null;
}): Worthiness {
  const notes: Worthiness["notes"] = [];
  let score = 70;
  const d = job.description;
  const dl = d.toLowerCase();

  if (job.salaryMin || job.salaryMax || /(salary|฿|rm|s\$|sgd|myr|thb|usd)\s*[\d,]{3,}/i.test(d)) {
    score += 10;
    notes.push({ tone: "good", text: "Salary transparency — postings with pay ranges convert to interviews at higher rates." });
  } else {
    score -= 5;
    notes.push({ tone: "neutral", text: "No salary information. Research the market band before investing time." });
  }

  if (d.length < 400) {
    score -= 15;
    notes.push({ tone: "bad", text: "Very thin job description — often a sign of a ghost posting or agency spam." });
  } else if (d.length > 1200) {
    score += 5;
    notes.push({ tone: "good", text: "Detailed description — the team likely knows what they want." });
  }

  if (/(urgent|immediate start|apply now!|walk[- ]?in)/i.test(dl)) {
    score -= 10;
    notes.push({ tone: "bad", text: "Urgency language detected — correlates with high-churn roles." });
  }

  const exclaims = (d.match(/!/g) ?? []).length;
  if (exclaims > 5) {
    score -= 5;
    notes.push({ tone: "bad", text: "Excessive exclamation marks — treat claims with skepticism." });
  }

  if (/^(requirements?|qualifications|responsibilities|what you)/im.test(d)) {
    score += 10;
    notes.push({ tone: "good", text: "Structured requirements section — your match report will be reliable." });
  }

  if (/(rockstar|ninja|guru|wear many hats|work hard play hard|like a family)/i.test(dl)) {
    score -= 10;
    notes.push({ tone: "bad", text: "Culture red-flag phrases detected (\"rockstar/ninja/family\")." });
  }

  return { score: Math.max(0, Math.min(100, score)), notes };
}
