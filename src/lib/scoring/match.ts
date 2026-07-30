import { ParsedResume } from "../parse";
import { extractSkills } from "../skills";

export interface MatchBreakdown {
  matchedSkills: string[];
  missingSkills: string[];
  mustHaves: { text: string; met: boolean }[];
  seniority: { required: string | null; resumeYears: number | null; verdict: string; ok: boolean };
  locationRisk: { level: "low" | "medium" | "high"; note: string };
  components: { name: string; score: number; weight: number }[];
}

export interface MatchResult {
  score: number;
  breakdown: MatchBreakdown;
}

const SENIORITY_YEARS: Record<string, [number, number]> = {
  JUNIOR: [0, 2],
  MID: [2, 5],
  SENIOR: [5, 12],
  LEAD: [7, 40],
};

function detectRequiredSeniority(jd: string): string | null {
  const t = jd.toLowerCase();
  if (/\b(principal|staff|lead|head of|director)\b/.test(t)) return "LEAD";
  if (/\bsenior|sr\.?\b/.test(t)) return "SENIOR";
  if (/\bjunior|entry[- ]level|fresh grad|graduate\b/.test(t)) return "JUNIOR";
  const years = t.match(/(\d{1,2})\+?\s*years?/);
  if (years) {
    const y = parseInt(years[1], 10);
    if (y >= 7) return "LEAD";
    if (y >= 5) return "SENIOR";
    if (y >= 2) return "MID";
    return "JUNIOR";
  }
  return null;
}

/** Extract explicit requirement lines ("must have", "required", "requirements" bullets). */
function extractMustHaves(jd: string): string[] {
  const lines = jd.split("\n").map((l) => l.trim());
  const out: string[] = [];
  let inReqBlock = false;
  for (const line of lines) {
    if (/^(requirements?|must[- ]haves?|qualifications|what you('|’)ll need|minimum qualifications)\b/i.test(line)) {
      inReqBlock = true;
      continue;
    }
    if (/^(nice to have|preferred|bonus|benefits?|perks|about (us|the company)|responsibilities)\b/i.test(line)) {
      inReqBlock = false;
      continue;
    }
    const isBullet = /^[-•*▪◦‣·]/.test(line) || /^\d+\./.test(line);
    if (inReqBlock && isBullet && line.length > 8) {
      out.push(line.replace(/^[-•*▪◦‣·\d.\s]+/, "").slice(0, 160));
    }
    if (!inReqBlock && isBullet && /\b(must have|required|mandatory)\b/i.test(line)) {
      out.push(line.replace(/^[-•*▪◦‣·\d.\s]+/, "").slice(0, 160));
    }
  }
  return out.slice(0, 10);
}

export function scoreMatch(
  parsed: ParsedResume,
  resumeText: string,
  job: { description: string; market: string; location?: string | null; seniority?: string | null }
): MatchResult {
  const jd = job.description;
  const jdSkills = extractSkills(jd).map((s) => s.name);
  const resumeSkillSet = new Set(parsed.skills);

  const matchedSkills = jdSkills.filter((s) => resumeSkillSet.has(s));
  const missingSkills = jdSkills.filter((s) => !resumeSkillSet.has(s));
  const skillScore = jdSkills.length === 0 ? 65 : Math.round((matchedSkills.length / jdSkills.length) * 100);

  // Must-have lines: met if >=1 known skill in that line is on the resume,
  // or the line contains no detectable skill (can't verify → assume neutral-met).
  const mustHaveLines = extractMustHaves(jd);
  const mustHaves = mustHaveLines.map((text) => {
    const lineSkills = extractSkills(text).map((s) => s.name);
    if (lineSkills.length === 0) {
      const yearsReq = text.match(/(\d{1,2})\+?\s*years?/);
      if (yearsReq && parsed.yearsOfExperience !== null) {
        return { text, met: parsed.yearsOfExperience >= parseInt(yearsReq[1], 10) };
      }
      return { text, met: true };
    }
    return { text, met: lineSkills.some((s) => resumeSkillSet.has(s)) };
  });
  const mustHaveScore =
    mustHaves.length === 0 ? 75 : Math.round((mustHaves.filter((m) => m.met).length / mustHaves.length) * 100);

  // Seniority fit
  const required = job.seniority || detectRequiredSeniority(jd);
  let seniorityScore = 70;
  let verdict = "Could not determine required seniority — verify manually.";
  let seniorityOk = true;
  if (required && parsed.yearsOfExperience !== null) {
    const [min, max] = SENIORITY_YEARS[required] ?? [0, 40];
    const y = parsed.yearsOfExperience;
    if (y >= min && y <= max + 3) {
      seniorityScore = 100;
      verdict = `Role targets ${required.toLowerCase()} level; your ~${y} years fit the band.`;
    } else if (y < min) {
      seniorityScore = Math.max(20, 100 - (min - y) * 25);
      verdict = `Role targets ${required.toLowerCase()} level (~${min}+ yrs); you show ~${y} yrs. Expect pushback — lead with strongest scoped achievements.`;
      seniorityOk = false;
    } else {
      seniorityScore = 70;
      verdict = `You may read as overqualified (${y} yrs vs ${required.toLowerCase()} band). Address motivation in the cover letter.`;
    }
  } else if (required) {
    verdict = `Role targets ${required.toLowerCase()} level; add explicit years of experience to your resume so parsers can verify.`;
  }

  // Location / visa risk for SEA markets
  const jdLower = jd.toLowerCase();
  let locationRisk: MatchBreakdown["locationRisk"] = { level: "low", note: "No location constraints detected." };
  if (job.market === "SG" || job.market === "MY" || job.market === "TH") {
    const marketName = { SG: "Singapore", MY: "Malaysia", TH: "Thailand" }[job.market as "SG" | "MY" | "TH"];
    if (/(citizens?|permanent residents?|pr holders?|no visa sponsorship|work authorization required|local candidates? only)/i.test(jdLower)) {
      locationRisk = {
        level: "high",
        note: `JD restricts to ${marketName} citizens/PR or excludes sponsorship. Confirm eligibility before spending an application.`,
      };
    } else if (/(visa|work permit|employment pass|ep|relocation)/i.test(jdLower)) {
      locationRisk = {
        level: "medium",
        note: `JD mentions visa/permit topics for ${marketName}. Prepare a one-line work-authorization answer.`,
      };
    } else {
      locationRisk = { level: "low", note: `No explicit citizenship/PR restriction found for this ${marketName} role.` };
    }
  } else if (job.market === "REMOTE") {
    if (/(us only|based in the (us|uk|eu)|specific time ?zones?|utc[+-]|est|pst|cet)/i.test(jdLower)) {
      locationRisk = { level: "medium", note: "Remote role has timezone or country restrictions — verify overlap with your hours." };
    } else {
      locationRisk = { level: "low", note: "Remote role with no obvious geo restriction detected." };
    }
  }
  const locationScore = locationRisk.level === "high" ? 30 : locationRisk.level === "medium" ? 75 : 100;

  const components = [
    { name: "Skills overlap", score: skillScore, weight: 45 },
    { name: "Must-have requirements", score: mustHaveScore, weight: 25 },
    { name: "Seniority fit", score: seniorityScore, weight: 20 },
    { name: "Location / eligibility", score: locationScore, weight: 10 },
  ];
  const score = Math.round(components.reduce((s, c) => s + (c.score * c.weight) / 100, 0));

  return {
    score,
    breakdown: {
      matchedSkills,
      missingSkills,
      mustHaves,
      seniority: { required, resumeYears: parsed.yearsOfExperience, verdict, ok: seniorityOk },
      locationRisk,
      components,
    },
  };
}
