# CareerForge — Implementation Progress

**Updated:** 2026-07-30  
**Product:** Premium Job Tracker, Matcher & Applier  
**Plan:** [premium-job-applier-plan.md](./premium-job-applier-plan.md)

---

## Todo status (10)

| # | ID | Task | Status |
|---|----|------|--------|
| 1 | `scaffold` | Scaffold Next.js + Prisma + Auth + design system shell | **completed** |
| 2 | `resume-ats` | Resume upload/parse + explainable ATS scoring UI | **completed** |
| 3 | `match-gate` | Job ingest + JD match reports + quality gate thresholds | **completed** |
| 4 | `apply-studio` | Cover letter studio + Assisted checklist + pipeline Kanban | **completed** |
| 5 | `billing-insights` | Stripe / Pro gating + conversion cockpit | **completed** |
| 6 | `semi-auto` | Phase 2: Chrome extension semi-auto fill + SEA/remote trends | **completed** |
| 7 | `stripe-billing` | Real Stripe checkout + webhook → flip user.plan to PRO | **completed** |
| 8 | `multi-resume` | Multi-resume targeting + A/B outcome tracking | **completed** |
| 9 | `reminders-share` | Follow-up reminders + shareable reports | **completed** |
| 10 | `admin-metering` | Admin dashboard + per-user rate limiting | **completed** |

**Overall:** 10 / 10 completed · Phase 1–3 done ✅

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

### 7. Stripe billing — completed

- **Checkout flow** — Settings page now has working "Upgrade to Pro" button → POST `/api/stripe/checkout` → redirect to Stripe Checkout session
- **Webhook handler** — Processes `checkout.session.completed` (upgrade to PRO) and `customer.subscription.deleted` (downgrade to FREE) with signature verification
- **Customer portal** — PRO users can manage/cancel subscription via Stripe portal
- **Settings UI** — Plan card shows current plan, limits, upgrade CTA (FREE) or manage subscription button (PRO)

**Key paths:** `src/app/(app)/settings/settings-client.tsx` (PlanCardClient), `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/stripe/portal/route.ts`

### 8. Multi-resume targeting + A/B — completed

- **Resume role family tagging** — Resume detail page now has a dropdown to tag resumes as BACKEND / FULLSTACK / DATA / DEVOPS / MOBILE / OTHER
- **Auto-suggest in workbench** — Job workbench auto-selects the best-fit resume by matching JD title keywords against resume roleFamily tags; shows "★ Recommended" badge
- **A/B variant comparison** — Insights page now shows interview rate by resume variant tag (when 2+ variants are used), enabling data-driven resume tailoring decisions

**Key paths:** `src/app/(app)/resumes/[id]/role-family-tagger.tsx`, `src/app/(app)/jobs/[id]/workbench-client.tsx`, `src/app/(app)/insights/page.tsx`, `src/app/api/resumes/[id]/route.ts`

### 9. Follow-up reminders + shareable reports — completed

- **Reminder interval setting** — Settings page now has a slider to configure reminder days (1–30, default 7)
- **Vercel cron config** — `vercel.json` schedules daily reminder check at 9:00 AM UTC
- **Share button in workbench** — "Generate share link" button creates a 30-day expiring token → shows URL with copy-to-clipboard
- **Public report page** — `/report/[token]` renders read-only match report with score, skills, seniority, and location risk

**Key paths:** `src/app/(app)/settings/settings-client.tsx`, `src/app/(app)/jobs/[id]/workbench-client.tsx`, `src/app/api/share/route.ts`, `src/app/report/[token]/page.tsx`, `vercel.json`

### 10. Admin metering — completed

- **Admin dashboard** — `/admin` page shows total users, jobs, resumes, applications, plan distribution (FREE vs PRO), application status breakdown, extension usage count, and last 20 pipeline events
- **Admin-only access** — 403 screen for non-admin users; nav link conditionally shown only when `user.isAdmin` is true
- **Rate limiting** — In-memory per-user rate limiter (`src/lib/rate-limit.ts`) enforced on match runs (20 free / 200 pro per hour) and letter generation (10 free / 100 pro per hour); returns 429 with upgrade prompt

**Key paths:** `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/admin-client.tsx`, `src/lib/rate-limit.ts`, `src/components/nav-links.tsx`, `src/middleware.ts`

---

## Stack snapshot (as built)

| Layer | Choice |
|-------|--------|
| App | Next.js App Router + TypeScript |
| UI | Tailwind v4, custom workstation theme |
| DB | Prisma + SQLite (local); Postgres/Supabase for production |
| Auth | Auth.js credentials + Google OAuth (optional) |
| Scoring | Deterministic ATS + match engines; optional OpenAI enrichment |
| Billing | Stripe Checkout + Webhook + Customer Portal |
| Plans | FREE / PRO limits in `src/lib/constants.ts` |
| Extension | Chrome Manifest V3, content + popup + background scripts |
| Email | Resend (dev stub fallback) |
| Rate limiting | In-memory per-user, plan-aware |
| Cron | Vercel Cron for daily follow-up reminders |

---

## Phases 1–3 complete ✅

CareerForge is a fully functional premium job tracking & application conversion workstation with real Stripe billing, resume targeting, follow-up reminders, shareable reports, and admin metering.
