# CareerForge — Premium Job Tracker & Application Workstation

## Getting Started

### Local Development

```bash
npm run dev
```

Open http://localhost:3000

### Production Deployment

See [docs/deploy-vercel-supabase.md](docs/deploy-vercel-supabase.md)

**Quick start:**
1. Copy `.env.example` to `.env`
2. Fill in Supabase + Stripe + OpenAI keys
3. Run `./scripts/setup-supabase.sh`
4. Deploy to Vercel

## Architecture

- **Frontend**: Next.js App Router + Tailwind v4
- **Database**: Supabase Postgres (SQLite for local dev)
- **Auth**: Auth.js (credentials + Google OAuth)
- **Billing**: Stripe (Checkout + Webhook + Portal)
- **Storage**: Supabase Storage (CV files)
- **Extension**: Chrome Manifest V3

## Documentation

- [Deployment Guide](docs/deploy-vercel-supabase.md)
- [Implementation Plan](docs/premium-job-applier-plan.md)
- [Progress Tracker](docs/progress.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| App | Next.js App Router + TypeScript |
| UI | Tailwind v4 |
| DB | Prisma + Supabase Postgres |
| Auth | Auth.js credentials + Google OAuth |
| Billing | Stripe (Checkout + Webhook + Portal) |
| Extension | Chrome Manifest V3 |

## Features

- Resume upload/parse with ATS scoring
- Job matching engine (skills, seniority, location)
- Cover letter studio with 3 templates
- Pipeline Kanban board
- Chrome extension for job board scraping
- Stripe billing (FREE/PRO plans)
- Collaboration with notes
- PWA support

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
