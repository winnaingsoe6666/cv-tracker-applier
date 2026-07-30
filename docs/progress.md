# CareerForge — Implementation Progress

**Updated:** 2026-07-30  
**Product:** Premium Job Tracker, Matcher & Applier  
**Plan:** [premium-job-applier-plan.md](./premium-job-applier-plan.md)

---

## Todo status (6)

| # | ID | Task | Status |
|---|----|------|--------|
| 1 | `scaffold` | Scaffold Next.js + Prisma + Auth + design system shell | **completed** |
| 2 | `resume-ats` | Resume upload/parse + explainable ATS scoring UI | **completed** |
| 3 | `match-gate` | Job ingest + JD match reports + quality gate thresholds | **completed** |
| 4 | `apply-studio` | Cover letter studio + Assisted checklist + pipeline Kanban | **completed** |
| 5 | `billing-insights` | Stripe / Pro gating + conversion cockpit | **completed** |
| 6 | `semi-auto` | Phase 2: Chrome extension semi-auto fill + SEA/remote trends | **completed** |

**Overall:** 6 / 6 completed · All phases done ✅

---

## Progress detail

### 1. Scaffold — completed

- Next.js (App Router) + TypeScript + Tailwind v4
- Prisma schema + SQLite local DB (`prisma/dev.db`)
- Auth.js (NextAuth v5) credentials login + register API
- Middleware protecting app routes
- Theme tokens, shared UI (`ScoreRing`, cards, badges, buttons)
- Landing, login, register pages
- App shell with sidebar nav (Dashboard, Resumes, Jobs, Pipeline, Insights, Settings)

**Key paths:** `prisma/schema.prisma`, `src/auth.ts`, `src/middleware.ts`, `src/components/ui.tsx`, `src/app/(app)/layout.tsx`

### 2. Resume ATS — completed

- Resume upload (PDF / DOCX / TXT) + paste text
- Text extraction + structured parse (contact, sections, skills, bullets)
- Deterministic ATS scorer with weighted categories + findings/fixes
- Resume list + detail report UI (score ring, breakdown, skills, delete)
- Optional LLM recruiter critique (when `OPENAI_API_KEY` set)
- Free-plan resume slot limits

**Key paths:** `src/lib/parse.ts`, `src/lib/skills.ts`, `src/lib/scoring/ats.ts`, `src/app/(app)/resumes/`, `src/app/api/resumes/`

### 3. Match gate — completed

- Job create API (TH / MY / SG / REMOTE markets)
- Job worthiness heuristics
- JD match engine (skills, must-haves, seniority, location/visa risk)
- Match + JD-aware ATS API (`/api/jobs/[id]/match`)
- Quality gate on status → APPLIED (`/api/applications/[id]`)
- Jobs list page + job create form
- Cover letter generate/edit APIs (wired early)
- **Job detail / workbench page** (`/jobs/[id]`) — 2-col layout with JD on the right, workbench on the left
- **Match UI** — resume picker, run-match button with spinner, score ring previews
- **MatchReport component** — skills overlap, missing skills, must-haves, seniority, location risk, ATS categories
- **GateBanner component** — pass/fail banner with guarded override confirm flow
- **`/api/jobs/[id]/match/latest`** — GET endpoint to fetch latest match+ATS breakdown after run

**Key paths:** `src/app/(app)/jobs/[id]/page.tsx`, `src/app/(app)/jobs/[id]/workbench-client.tsx`, `src/components/match-report.tsx`, `src/components/gate-banner.tsx`, `src/app/api/jobs/[id]/match/latest/route.ts`

### 4. Apply studio — completed

- Cover letter studio page (`/jobs/[id]/studio`) — 3 templates, resume picker, generate/save/copy editor, past drafts list
- `StudioClient` — tabbed UI: Cover Letter Studio + Apply Checklist
- Assisted apply checklist — 8 items, auto-saves to `application.checklistJson`, progress bar, READY callout
- Pipeline Kanban page (`/pipeline`) — all 8 statuses, score pills, optimistic status transitions, move dropdown
- `KanbanBoard` component — horizontal scroll, color-coded columns, Studio quick-link per card
- Dashboard page (`/dashboard`) — stat cards, quick actions, recent applications
- Settings page (`/settings`) — profile, plan, gate thresholds
- Insights placeholder page (`/insights`) — pending billing-insights phase

**Key paths:** `src/app/(app)/jobs/[id]/studio/`, `src/app/(app)/pipeline/page.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/settings/page.tsx`, `src/components/kanban-board.tsx`

### 5. Billing insights — completed

- Settings page rebuilt with editable profile form (name, headline, phone, linkedin, location)
- Interactive range sliders for gate thresholds (ATS + match) with live color feedback
- `PATCH /api/settings` — saves profile + thresholds in one call
- Pro plan card with limits display and upgrade CTA stub
- `UpgradeBanner` component — contextual warning at 80%+ of free plan limits (resumes, jobs)
- Dashboard rebuilt — interview rate highlight, plan usage bars, 2-col layout with quick actions sidebar
- Insights cockpit — full conversion analytics:
  - Funnel: tracked → applied → screening → interview → offer
  - Interview rate by match score band (80–100, 65–79, 50–64, <50)
  - Interview rate by market (TH/MY/SG/REMOTE)
  - Score-vs-outcome ScoreRings (avg match score: interviewed vs rejected)
  - Speed metrics (avg days saved→applied, rejection rate)

**Key paths:** `src/app/(app)/settings/`, `src/app/(app)/insights/page.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/app/api/settings/route.ts`, `src/components/upgrade-banner.tsx`

### 6. Semi-auto — completed

- **Chrome Extension** (`extension/` directory):
  - `manifest.json` — Manifest V3, permissions for 6 job boards + generic host fallback
  - `content.js` — site-specific scrapers for LinkedIn, JobStreet, JobsDB, Indeed, Seek, Glassdoor + JSON-LD / OG meta / largest-text-block generic fallback
  - `popup.html` + `popup.js` — dark-themed popup with job detection card, market selector, push button, one-time token setup panel, worthiness score display on success
  - `background.js` — service worker; opens Settings on first install
  - `icons/` — 128px, 48px, 16px icons (generated via sharp)
  - `README.md` — install guide, API spec, privacy notes
- **Settings → Browser Extension panel** (`settings-client.tsx`):
  - `ExtensionTokenPanel` exported component — generate / regenerate / revoke `cf_xxx` API token
  - One-time reveal with copy-to-clipboard + masked `cf_••••••••suffix` display on revisit
  - 3-step setup instructions + supported board badges
- **Insights → Market Trend Briefs**:
  - 4 market cards: Thailand 🇹🇭, Malaysia 🇲🇾, Singapore 🇸🇬, Remote 🌏
  - Per card: top 5 in-demand skills, salary range (local + USD), remote %, hot role families, demand heat badge (🔥 Hot / 📈 Growing), context note
- **Bug fixes**: corrected 3 pre-existing TypeScript errors in `push-job/route.ts` (`scoreWorthiness` import, removed non-existent `note` field, fixed `include` type)

**Key paths:** `extension/`, `src/app/(app)/settings/settings-client.tsx`, `src/app/(app)/insights/page.tsx`, `src/app/api/extension/push-job/route.ts`

---

## Stack snapshot (as built)

| Layer | Choice |
|-------|--------|
| App | Next.js App Router + TypeScript |
| UI | Tailwind v4, custom workstation theme |
| DB | Prisma + SQLite (local); Postgres/Supabase for production |
| Auth | Auth.js credentials |
| Scoring | Deterministic ATS + match engines; optional OpenAI enrichment |
| Plans | FREE / PRO limits in `src/lib/constants.ts` |
| Extension | Chrome Manifest V3, content + popup + background scripts |

---

## All 6 phases complete ✅

CareerForge is a fully functional premium job tracking & application conversion workstation.
No pending work remains for the planned scope.
