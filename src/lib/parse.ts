import { extractSkills } from "./skills";

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  sections: string[]; // canonical section names detected
  skills: string[]; // canonical skill names detected
  yearsOfExperience: number | null;
  wordCount: number;
  bulletCount: number;
  quantifiedBullets: number; // bullets containing numbers/metrics
  actionVerbBullets: number; // bullets starting with a strong verb
}

const SECTION_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "summary", re: /^\s*(professional\s+summary|summary|profile|about\s*me?|objective)\b/im },
  { name: "experience", re: /^\s*(work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history)\b/im },
  { name: "education", re: /^\s*(education|academic\s+background|qualifications)\b/im },
  { name: "skills", re: /^\s*(skills|technical\s+skills|core\s+competencies|technologies|tech\s+stack)\b/im },
  { name: "projects", re: /^\s*(projects|personal\s+projects|selected\s+projects|portfolio)\b/im },
  { name: "certifications", re: /^\s*(certifications?|licenses?|courses)\b/im },
  { name: "languages", re: /^\s*(languages)\b/im },
];

const ACTION_VERBS = [
  "built", "led", "designed", "developed", "launched", "shipped", "created", "improved",
  "reduced", "increased", "optimized", "architected", "implemented", "migrated", "automated",
  "delivered", "managed", "mentored", "owned", "drove", "scaled", "refactored", "established",
  "spearheaded", "streamlined", "integrated", "deployed", "engineered", "initiated", "achieved",
  "grew", "cut", "saved", "accelerated", "modernized", "consolidated", "negotiated",
];

export function parseResumeText(rawText: string): ParsedResume {
  const text = rawText.replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.trim());

  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ?? null;
  const phone =
    text.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/)?.[0]?.trim() ?? null;
  const linkedin = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)?.[0] ?? null;
  const github = text.match(/github\.com\/[a-zA-Z0-9_-]+/i)?.[0] ?? null;
  const website =
    text.match(/https?:\/\/(?!.*(linkedin|github))[a-zA-Z0-9./_-]+/i)?.[0] ?? null;

  // Heuristic: name is the first short non-contact line.
  let name: string | null = null;
  for (const line of lines.slice(0, 8)) {
    if (!line || line.length > 60) continue;
    if (/[@\d]/.test(line)) continue;
    if (/resume|curriculum|cv\b/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      name = line;
      break;
    }
  }

  const sections = SECTION_PATTERNS.filter((s) => s.re.test(text)).map((s) => s.name);
  const skills = extractSkills(text).map((s) => s.name);

  // Years of experience: explicit statement, else spread of years mentioned.
  let yearsOfExperience: number | null = null;
  const explicit = text.match(/(\d{1,2})\+?\s*years?\s+(of\s+)?(professional\s+)?experience/i);
  if (explicit) {
    yearsOfExperience = parseInt(explicit[1], 10);
  } else {
    const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => parseInt(m[0], 10));
    const now = new Date().getFullYear();
    const plausible = years.filter((y) => y >= 1990 && y <= now);
    if (plausible.length >= 2) {
      const latest = /present|current/i.test(text) ? now : Math.max(...plausible);
      const span = latest - Math.min(...plausible);
      yearsOfExperience = Math.min(Math.max(span, 0), 40);
    }
  }

  const bullets = lines.filter((l) => /^[-•*▪◦‣·]/.test(l) || /^\d+\./.test(l));
  const quantifiedBullets = bullets.filter((b) => /\d/.test(b)).length;
  const actionVerbBullets = bullets.filter((b) => {
    const first = b.replace(/^[-•*▪◦‣·\d.\s]+/, "").split(/\s+/)[0]?.toLowerCase() ?? "";
    return ACTION_VERBS.includes(first);
  }).length;

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    website,
    sections,
    skills,
    yearsOfExperience,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    bulletCount: bullets.length,
    quantifiedBullets,
    actionVerbBullets,
  };
}

/** Extract plain text from an uploaded resume file (PDF, DOCX, or TXT). */
export async function extractTextFromFile(fileName: string, buffer: Buffer): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString("utf-8");
}
