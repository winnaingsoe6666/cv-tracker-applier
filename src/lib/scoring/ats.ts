import { ParsedResume } from "../parse";
import { extractSkills } from "../skills";

export type Severity = "critical" | "warning" | "pass";

export interface Finding {
  severity: Severity;
  category: string;
  message: string;
  fix: string;
}

export interface AtsCategoryScore {
  category: string;
  score: number; // 0-100
  weight: number; // contribution to total
}

export interface AtsBreakdown {
  categories: AtsCategoryScore[];
  findings: Finding[];
  keywordCoverage: { matched: string[]; missing: string[] } | null; // only when scored vs a JD
}

export interface AtsResult {
  score: number;
  breakdown: AtsBreakdown;
}

/**
 * Deterministic, explainable ATS score. Mirrors what real parsers punish:
 * missing contact channels, unrecognizable sections, walls of text,
 * unquantified bullets, and (when a JD is provided) missing keywords.
 */
export function scoreAts(parsed: ParsedResume, rawText: string, jobDescription?: string): AtsResult {
  const findings: Finding[] = [];

  // --- Contact & links (weight 15) ---
  let contact = 100;
  if (!parsed.email) {
    contact -= 50;
    findings.push({ severity: "critical", category: "Contact", message: "No email address detected.", fix: "Add a professional email in the header — ATS parsers index it as the primary key." });
  }
  if (!parsed.phone) {
    contact -= 25;
    findings.push({ severity: "warning", category: "Contact", message: "No phone number detected.", fix: "Add a phone number with country code (e.g. +66 for Thailand) — recruiters in TH/MY/SG often call first." });
  }
  if (!parsed.linkedin) {
    contact -= 25;
    findings.push({ severity: "warning", category: "Contact", message: "No LinkedIn URL found.", fix: "Add your linkedin.com/in/... URL — most SEA recruiters cross-check LinkedIn before shortlisting." });
  }
  if (parsed.email && parsed.phone && parsed.linkedin) {
    findings.push({ severity: "pass", category: "Contact", message: "Email, phone and LinkedIn all detected.", fix: "" });
  }

  // --- Structure / sections (weight 20) ---
  const required = ["experience", "education", "skills"];
  const missing = required.filter((s) => !parsed.sections.includes(s));
  let structure = 100 - missing.length * 30;
  for (const m of missing) {
    findings.push({ severity: "critical", category: "Structure", message: `No recognizable "${m}" section heading.`, fix: `Add a plain heading like "${m[0].toUpperCase() + m.slice(1)}" — ATS parsers map content by standard headings, not layout.` });
  }
  if (!parsed.sections.includes("summary")) {
    structure -= 10;
    findings.push({ severity: "warning", category: "Structure", message: "No professional summary section.", fix: "Add a 2–3 line summary targeting the role family; it drives keyword density at the top of the parse." });
  }
  if (missing.length === 0) {
    findings.push({ severity: "pass", category: "Structure", message: "Core sections (experience, education, skills) all detected.", fix: "" });
  }

  // --- Length & density (weight 15) ---
  let length = 100;
  if (parsed.wordCount < 250) {
    length = 40;
    findings.push({ severity: "critical", category: "Length", message: `Resume is very short (${parsed.wordCount} words).`, fix: "Aim for 400–800 words: expand each role with 3–5 impact bullets." });
  } else if (parsed.wordCount < 400) {
    length = 70;
    findings.push({ severity: "warning", category: "Length", message: `Resume is on the short side (${parsed.wordCount} words).`, fix: "Add outcome-focused bullets to your most recent roles." });
  } else if (parsed.wordCount > 1100) {
    length = 65;
    findings.push({ severity: "warning", category: "Length", message: `Resume is long (${parsed.wordCount} words).`, fix: "Cut to the strongest 2 pages; recruiters spend under 30 seconds on the first pass." });
  } else {
    findings.push({ severity: "pass", category: "Length", message: `Word count (${parsed.wordCount}) is in the effective range.`, fix: "" });
  }

  // --- Bullet quality (weight 25) ---
  let bullets = 100;
  if (parsed.bulletCount < 5) {
    bullets = 40;
    findings.push({ severity: "critical", category: "Impact", message: `Only ${parsed.bulletCount} bullet points detected.`, fix: "Convert paragraphs into bullets — parsers and recruiters both scan bullets, not prose." });
  } else {
    const quantRatio = parsed.quantifiedBullets / parsed.bulletCount;
    const verbRatio = parsed.actionVerbBullets / parsed.bulletCount;
    if (quantRatio < 0.3) {
      bullets -= 35;
      findings.push({ severity: "critical", category: "Impact", message: `Only ${Math.round(quantRatio * 100)}% of bullets contain numbers.`, fix: "Quantify results (%, $, time saved, users, scale). Quantified bullets are the single strongest interview-rate lever." });
    } else if (quantRatio < 0.5) {
      bullets -= 15;
      findings.push({ severity: "warning", category: "Impact", message: `${Math.round(quantRatio * 100)}% of bullets are quantified — good, aim for 50%+.`, fix: "Add metrics to your top 3 achievements per role." });
    } else {
      findings.push({ severity: "pass", category: "Impact", message: `${Math.round(quantRatio * 100)}% of bullets are quantified.`, fix: "" });
    }
    if (verbRatio < 0.4) {
      bullets -= 20;
      findings.push({ severity: "warning", category: "Impact", message: "Many bullets don't start with a strong action verb.", fix: "Start bullets with verbs like Built, Led, Reduced, Shipped — avoid \"Responsible for\"." });
    }
  }

  // --- Skills visibility (weight 10) ---
  let skillsScore = 100;
  if (parsed.skills.length < 5) {
    skillsScore = 45;
    findings.push({ severity: "warning", category: "Skills", message: `Only ${parsed.skills.length} recognizable skills detected.`, fix: "Add a dedicated Skills section listing tools and technologies by name (spelled out, not just abbreviations)." });
  } else {
    findings.push({ severity: "pass", category: "Skills", message: `${parsed.skills.length} recognizable skills detected.`, fix: "" });
  }

  // --- Formatting risk (weight 15) ---
  let formatting = 100;
  const specialCharRatio = (rawText.match(/[^\x20-\x7E\n\r\t\u00A0-\u024F\u0E00-\u0E7F]/g)?.length ?? 0) / Math.max(rawText.length, 1);
  if (specialCharRatio > 0.02) {
    formatting -= 30;
    findings.push({ severity: "warning", category: "Formatting", message: "High ratio of unusual characters — often caused by icons, tables, or multi-column layouts.", fix: "Use a single-column layout with plain text; graphics and tables scramble ATS extraction." });
  }
  const capsLines = rawText.split("\n").filter((l) => l.trim().length > 10 && l === l.toUpperCase() && /[A-Z]/.test(l)).length;
  if (capsLines > 8) {
    formatting -= 15;
    findings.push({ severity: "warning", category: "Formatting", message: "Many all-caps lines detected.", fix: "Use Title Case for headings; all-caps blocks reduce readability and can break parsing of names." });
  }
  if (formatting === 100) {
    findings.push({ severity: "pass", category: "Formatting", message: "No major formatting risks detected in extracted text.", fix: "" });
  }

  // --- Keyword coverage vs JD (weight 0 or reweighted to 25 when JD given) ---
  let keywordCoverage: AtsBreakdown["keywordCoverage"] = null;
  let keywordScore: number | null = null;
  if (jobDescription && jobDescription.trim().length > 40) {
    const jdSkills = extractSkills(jobDescription).map((s) => s.name);
    const resumeSkillSet = new Set(parsed.skills);
    const matched = jdSkills.filter((s) => resumeSkillSet.has(s));
    const missingKw = jdSkills.filter((s) => !resumeSkillSet.has(s));
    keywordCoverage = { matched, missing: missingKw };
    keywordScore = jdSkills.length === 0 ? 70 : Math.round((matched.length / jdSkills.length) * 100);
    if (keywordScore < 50) {
      findings.push({ severity: "critical", category: "Keywords", message: `Resume covers only ${keywordScore}% of the skills named in this job description.`, fix: `Work these into real experience bullets (never keyword-stuff): ${missingKw.slice(0, 6).join(", ")}.` });
    } else if (keywordScore < 75) {
      findings.push({ severity: "warning", category: "Keywords", message: `Keyword coverage vs this JD is ${keywordScore}%.`, fix: `Missing: ${missingKw.slice(0, 6).join(", ")}. Add the ones you genuinely have.` });
    } else {
      findings.push({ severity: "pass", category: "Keywords", message: `Strong keyword coverage (${keywordScore}%) against this job description.`, fix: "" });
    }
  }

  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const base: AtsCategoryScore[] = [
    { category: "Contact", score: clamp(contact), weight: 15 },
    { category: "Structure", score: clamp(structure), weight: 20 },
    { category: "Length", score: clamp(length), weight: 15 },
    { category: "Impact", score: clamp(bullets), weight: 25 },
    { category: "Skills", score: clamp(skillsScore), weight: 10 },
    { category: "Formatting", score: clamp(formatting), weight: 15 },
  ];

  let categories = base;
  if (keywordScore !== null) {
    // Reweight so keyword coverage carries 25% when scoring against a JD.
    categories = base.map((c) => ({ ...c, weight: Math.round(c.weight * 0.75) }));
    categories.push({ category: "Keywords", score: clamp(keywordScore), weight: 25 });
  }

  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  const score = Math.round(categories.reduce((s, c) => s + (c.score * c.weight) / totalWeight, 0));

  const order: Record<Severity, number> = { critical: 0, warning: 1, pass: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return { score, breakdown: { categories, findings, keywordCoverage } };
}
