# Deploy to Vercel + Supabase

## Prerequisites

- GitHub account
- Vercel account (free)
- Supabase account (free)

## Step 1: Create Supabase Project

1. Go to https://supabase.com → Sign in
2. Click "New Project"
3. Enter project name (e.g., `careerforge-prod`)
4. Enter database password (save this!)
5. Select region closest to your users
6. Click "Create new project"

## Step 2: Get Supabase Credentials

After project creates:

1. Go to Settings → Database
   - Copy `Connection string` → `URI`
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

2. Go to Settings → API
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `anon public` key → `SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_KEY`

## Step 3: Push to GitHub

```bash
git remote add origin https://github.com/yourusername/cv-tracker-applier.git
git push -u origin master
```

## Step 4: Deploy to Vercel

1. Go to https://vercel.com → Sign in with GitHub
2. Click "Import Project"
3. Select your repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-here
   OPENAI_API_KEY=sk-...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_KEY=eyJ...
   ```
6. Click "Deploy"

## Step 5: Run Database Migration

After first deploy:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Pull env vars
vercel env pull .env.local

# Push schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. SSL auto-configured by Vercel

## Step 7: Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy webhook signing secret → add to Vercel env vars

## Troubleshooting

### Database Connection Errors
- Ensure IP whitelist in Supabase allows Vercel (or disable for testing)
- Check `DATABASE_URL` format is correct

### Build Failures
- Check Vercel build logs
- Ensure all env vars are set

### Auth Issues
- `NEXTAUTH_URL` must match your Vercel domain exactly
- Generate secret: `openssl rand -base64 32`
