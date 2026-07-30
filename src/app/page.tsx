import Link from "next/link";
import { btnPrimary, btnSecondary } from "@/components/ui";

const FEATURES = [
  {
    title: "ATS Score Engine",
    body: "Explainable 0–100 scoring across contact, structure, impact, keywords and formatting risk — with the exact fix for every point lost.",
  },
  {
    title: "JD Match Reports",
    body: "Skills overlap, must-have verification, seniority fit and visa/eligibility risk for Thailand, Malaysia, Singapore and remote roles.",
  },
  {
    title: "Quality Gate",
    body: "The app blocks weak applications before you send them. Fewer, sharper applications is how you raise your interview rate.",
  },
  {
    title: "Cover Letter Studio",
    body: "Three recruiter-grade templates — Direct, Narrative, Technical — pre-filled from your resume and the job description.",
  },
  {
    title: "Recruiter Pipeline",
    body: "A real pipeline board from Saved to Offer, with every score snapshotted at apply time so you learn what converts.",
  },
  {
    title: "Semi-Auto Apply",
    body: "Browser extension captures job pages and fills application forms from your approved profile. You always confirm the submit.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim font-bold text-[#06281c]">C</div>
          <span className="text-lg font-semibold tracking-tight">CareerForge</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className={btnSecondary}>
            Sign in
          </Link>
          <Link href="/register" className={btnPrimary}>
            Create account
          </Link>
        </nav>
      </header>

      <section className="py-20 text-center">
        <p className="mx-auto mb-4 w-fit rounded-full border border-edge bg-surface px-4 py-1 text-xs font-medium tracking-wide text-accent">
          FOR TH · MY · SG · REMOTE WORLDWIDE
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight">
          Apply fewer. <span className="text-accent">Interview more.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
          CareerForge is a recruiter-grade workstation that scores your resume like an ATS, matches it against every job
          description, and refuses to let a weak application out the door.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className={btnPrimary}>
            Start free — 2 resumes, 10 jobs
          </Link>
          <Link href="/login" className={btnSecondary}>
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-edge bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-edge py-8 text-center text-xs text-faint">
        CareerForge — professional application quality control. No chat bots. No spray-and-pray.
      </footer>
    </main>
  );
}
