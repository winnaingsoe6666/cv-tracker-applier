export const PLANS = {
  FREE: { label: "Free", maxResumes: 2, maxJobs: 10, maxLettersPerMonth: 5 },
  PRO: { label: "Pro", maxResumes: 50, maxJobs: 1000, maxLettersPerMonth: 1000 },
} as const;

export type Plan = keyof typeof PLANS;

export const MARKETS = [
  { value: "TH", label: "Thailand" },
  { value: "MY", label: "Malaysia" },
  { value: "SG", label: "Singapore" },
  { value: "REMOTE", label: "Remote (worldwide)" },
  { value: "OTHER", label: "Other" },
] as const;

export const SENIORITIES = ["JUNIOR", "MID", "SENIOR", "LEAD"] as const;

export const PIPELINE_STATUSES = [
  "SAVED",
  "TAILORING",
  "READY",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const STATUS_LABELS: Record<PipelineStatus, string> = {
  SAVED: "Saved",
  TAILORING: "Tailoring",
  READY: "Ready",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const LETTER_TEMPLATES = [
  { value: "DIRECT", label: "Direct", hint: "Straight to fit and impact. Best for high-volume markets." },
  { value: "NARRATIVE", label: "Narrative", hint: "Story-driven. Best for startups and culture-heavy teams." },
  { value: "TECHNICAL", label: "Technical", hint: "Depth-first. Best for senior engineering roles." },
] as const;

export const APPLY_CHECKLIST_ITEMS = [
  { id: "gate", label: "Quality gate passed (ATS + match above thresholds)" },
  { id: "tailored", label: "Resume tailored to this job description" },
  { id: "keywords", label: "Top missing keywords addressed or consciously skipped" },
  { id: "letter", label: "Cover letter reviewed and personalized" },
  { id: "contact", label: "Contact details and links verified on export" },
  { id: "filename", label: "File named professionally (Name_Role_Company.pdf)" },
  { id: "salary", label: "Salary expectation researched for this market" },
  { id: "visa", label: "Work authorization / visa answer prepared" },
] as const;
