import { ParsedResume } from "./parse";

interface LetterInput {
  userName: string;
  headline: string | null;
  parsed: ParsedResume;
  job: { title: string; company: string; market: string; description: string };
  matchedSkills: string[];
}

function topSkills(input: LetterInput, n: number): string {
  const list = input.matchedSkills.length > 0 ? input.matchedSkills : input.parsed.skills;
  return list.slice(0, n).join(", ");
}

function yearsPhrase(parsed: ParsedResume): string {
  return parsed.yearsOfExperience ? `${parsed.yearsOfExperience}+ years of experience` : "hands-on experience";
}

/**
 * Deterministic recruiter-grade cover letter drafts. Every draft is a starting
 * point the user edits in the Studio — [bracketed] slots mark what to personalize.
 */
export function generateLetter(template: string, input: LetterInput): string {
  const { userName, job, parsed } = input;
  const skills = topSkills(input, 4);
  const years = yearsPhrase(parsed);
  const role = job.title;
  const company = job.company;

  if (template === "NARRATIVE") {
    return `Dear Hiring Team at ${company},

When I saw the ${role} opening, one line in the description stood out to me: [quote the sentence from the JD that genuinely resonates]. That is exactly the kind of problem I have spent my career solving.

With ${years} across ${skills}, my path has been defined by [one-sentence career theme — e.g. "turning ambiguous requirements into shipped products"]. Most recently, [your strongest story: situation, what you did, measurable result].

What draws me to ${company} specifically is [company-specific reason: product, market, engineering culture — research this, do not skip it]. I believe the perspective I bring from [your differentiator] would translate directly to [team goal implied by the JD].

I would welcome the chance to discuss how I can contribute. Thank you for your consideration.

Best regards,
${userName}${input.headline ? `\n${input.headline}` : ""}`;
  }

  if (template === "TECHNICAL") {
    return `Dear Hiring Team at ${company},

I am applying for the ${role} position. My background maps directly onto your stack and requirements:

- ${skills.split(", ").slice(0, 4).map((s) => s).join("\n- ") || "[key skill]"}

With ${years}, I have [strongest technical achievement with metrics — e.g. "reduced API p95 latency 60% while scaling to 2M requests/day"]. I focus on [engineering value from the JD: reliability, velocity, clean architecture] and have owned systems end to end, from design through production operations.

Two results most relevant to this role:
1. [Quantified achievement matching the JD's core responsibility]
2. [Second achievement — different dimension: scale, cost, quality, or leadership]

I would be glad to walk through the technical details in an interview. Thank you for your time.

Best regards,
${userName}${input.headline ? `\n${input.headline}` : ""}`;
  }

  // DIRECT (default)
  return `Dear Hiring Team at ${company},

I am writing to apply for the ${role} position. With ${years} in ${skills}, I can contribute from week one.

Three reasons I am a strong fit:
- [Achievement #1 with a number — mirror the JD's top responsibility]
- [Achievement #2 — a different strength: scale, ownership, or cross-team work]
- [Reason you fit this market/team — e.g. based in the region, timezone overlap, domain knowledge]

I am confident I can deliver the results this role demands, and I would welcome a conversation about how.

Thank you for your consideration.

Best regards,
${userName}${input.headline ? `\n${input.headline}` : ""}`;
}
