# 🚀 Ultimate Digital Planner - Deployment Guide

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/astral-planner)

## Prerequisites

- Node.js 20+ installed
- Git installed
- Vercel account (free tier works)
- Neon database account (free tier available)
- Clerk account (free tier available)

## Step-by-Step Deployment

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/astral-planner.git
cd astral-planner

# Install dependencies
npm install
```

### 2. Set Up Services

#### Neon Database Setup
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string from the dashboard
4. Enable connection pooling

#### Clerk Authentication Setup
1. Sign up at [clerk.dev](https://clerk.dev)
2. Create a new application
3. Enable Google and GitHub OAuth providers
4. Copy your publishable and secret keys

#### Pusher Setup (Optional for real-time)
1. Sign up at [pusher.com](https://pusher.com)
2. Create a new app
3. Copy your app credentials

#### OpenAI Setup (Optional for AI features)
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Generate an API key
3. Add billing (pay-as-you-go)

### 3. Environment Configuration

Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# AI (Optional)
OPENAI_API_KEY="sk-..."

# Real-time (Optional)
NEXT_PUBLIC_PUSHER_KEY="..."
PUSHER_APP_ID="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="us2"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Push database schema
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

### 5. Local Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### 6. Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to:
# - Link to your Vercel account
# - Set up project
# - Configure environment variables
```

#### Option B: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### 7. Post-Deployment Setup

#### Configure Clerk Webhook
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/auth/webhook`
3. Select events: user.created, user.updated, user.deleted
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

#### Set Production URLs
Update environment variables in Vercel:
```env
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"
```

#### Configure Custom Domain (Optional)
1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | - |
| `PUSHER_*` | Pusher credentials for real-time | - |
| `SENTRY_DSN` | Sentry error tracking | - |
| `VERCEL_ANALYTICS_ID` | Vercel Analytics | Auto-configured |

## Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

## Monitoring & Analytics

### Vercel Analytics
Automatically enabled when deploying to Vercel.

### Sentry Error Tracking
1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Add `SENTRY_DSN` to environment variables
4. Errors will be automatically tracked

### Custom Analytics
- User activity tracked in database
- Productivity metrics calculated in real-time
- AI insights generated daily

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

#### Database Connection Issues
- Ensure connection string includes `?sslmode=require`
- Check if IP is whitelisted in Neon dashboard
- Verify connection pooling is enabled

#### Authentication Issues
- Verify Clerk keys are correct
- Check webhook endpoint is accessible
- Ensure redirect URLs match your domain

#### Missing Dependencies
```bash
# Install all dependencies
npm install --legacy-peer-deps
```

## Performance Optimization

### Enable Caching
```javascript
// next.config.js
module.exports = {
  // ... other config
  experimental: {
    incrementalCacheHandlerPath: './.next/cache'
  }
}
```

### Image Optimization
- Use Next.js Image component
- Configure image domains in next.config.js
- Enable AVIF format for better compression

### Bundle Size
```bash
# Analyze bundle
npm run analyze

# Check bundle size
npm run build
```

## Security Checklist

- [ ] Environment variables set in production only
- [ ] Clerk webhook secret configured
- [ ] Database connection uses SSL
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers in place
- [ ] API routes protected with authentication
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] SQL injection prevention (using ORM)

## Backup & Recovery

### Database Backups
Neon provides automatic daily backups. For manual backups:

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Data Export
Users can export their data from Settings → Export Data

## Scaling Considerations

### Vercel Limits (Free Tier)
- 100GB bandwidth/month
- 100 hours build time/month
- 10 second function timeout

### Neon Limits (Free Tier)
- 3GB storage
- 1 compute hour/day
- Automatic scaling

### Upgrade Path
1. Vercel Pro: $20/month for unlimited bandwidth
2. Neon Pro: $19/month for more storage and compute
3. Clerk Pro: Based on MAU (Monthly Active Users)

## Support

- Documentation: [docs.astralplanner.com](https://docs.astralplanner.com)
- GitHub Issues: [github.com/yourusername/astral-planner/issues](https://github.com/yourusername/astral-planner/issues)
- Discord: [discord.gg/astralplanner](https://discord.gg/astralplanner)

## License

MIT License - See LICENSE file for details

---

**Ready to deploy!** 🎉 Follow the steps above and your Ultimate Digital Planner will be live in minutes.