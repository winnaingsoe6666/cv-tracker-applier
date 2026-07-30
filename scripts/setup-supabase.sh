#!/bin/bash
# Supabase + Prisma setup script

set -e

echo "🚀 Setting up Supabase + Prisma..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copy .env.example to .env and fill in values."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push schema to Supabase
echo "🗄️  Pushing schema to Supabase..."
npx prisma db push

# Seed database (optional)
# echo "🌱 Seeding database..."
# npx prisma db seed

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start development server"
echo "2. Run 'vercel deploy' to deploy to Vercel"
