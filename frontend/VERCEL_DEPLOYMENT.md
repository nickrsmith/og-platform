# Vercel Deployment Guide

This guide covers deploying the O&G Platform frontend to Vercel.

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Git repository connected to Vercel

## Quick Deploy

### Option 1: Deploy via Vercel CLI

```bash
cd frontend
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Import your Git repository
3. Set Root Directory to: `frontend`
4. Configure build settings (auto-detected from `vercel.json`)
5. Set environment variables (see below)
6. Deploy

## Configuration

### Build Settings

The `vercel.json` file is already configured with:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Required Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

#### Production Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend-api.com
VITE_API_VERSION=v1

# Mock API (set to false for production)
VITE_USE_MOCK_API=false

# Web3Auth Configuration (if using Web3Auth)
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_WEB3AUTH_NETWORK=mainnet  # or 'testnet' for development

# Optional: Other environment variables
# VITE_ENVIRONMENT=production
```

#### Development/Preview Environment Variables

For preview deployments, you may want different values:

```bash
VITE_API_BASE_URL=https://staging-api.your-domain.com
VITE_USE_MOCK_API=false
VITE_WEB3AUTH_CLIENT_ID=your_dev_web3auth_client_id
VITE_WEB3AUTH_NETWORK=testnet
```

## Deployment Steps

### 1. First Time Deployment

```bash
cd frontend
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Select your account/team**
- Link to existing project? **No** (first time)
- What's your project's name? **og-platform-frontend** (or your choice)
- In which directory is your code located? **./** (current directory)
- Want to override settings? **No** (uses vercel.json)

### 2. Production Deployment

```bash
cd frontend
vercel --prod
```

### 3. Update Existing Deployment

Just push to your Git branch that's connected to Vercel:

```bash
git add .
git commit -m "Update UI for Vercel deployment"
git push
```

Vercel will automatically build and deploy if auto-deployment is enabled.

## Vercel Configuration File

The `vercel.json` file includes:

- **SPA Routing:** All routes rewrite to `/index.html` for client-side routing
- **Caching:** Static assets cached with immutable headers
- **Build Settings:** Framework and build commands configured

## Troubleshooting

### Build Fails

1. Check Node.js version in Vercel settings (should be 18.x or 20.x)
2. Verify all environment variables are set
3. Check build logs in Vercel dashboard

### Assets Not Loading

1. Verify `outputDirectory` is set to `dist` in `vercel.json`
2. Check that build completes successfully
3. Verify asset paths in build output

### Routing Issues

1. Ensure `rewrites` configuration in `vercel.json` is correct
2. All routes should rewrite to `/index.html` for SPA routing

### Environment Variables Not Working

1. Ensure variables are prefixed with `VITE_`
2. Redeploy after adding new environment variables
3. Check that variables are set for the correct environment (Production, Preview, Development)

## Post-Deployment

### Verify Deployment

1. Check deployment URL provided by Vercel
2. Test all major routes:
   - `/` - Homepage
   - `/login` - Login page
   - `/marketplace` - Asset listings
   - `/create-listing` - Create listing form
   - `/data-rooms` - Data rooms list

### Monitor

1. Check Vercel Analytics (if enabled)
2. Monitor error logs in Vercel Dashboard
3. Check Function logs for API errors

## Continuous Deployment

If your Git repository is connected to Vercel:

- **Automatic Deploys:** Every push to main branch triggers production deploy
- **Preview Deploys:** Every pull request gets a preview URL
- **Manual Deploys:** Use Vercel CLI or dashboard to deploy specific commits

## Environment-Specific Deployments

You can set different environment variables for:
- **Production:** `vercel --prod`
- **Preview:** Automatic on PRs
- **Development:** `vercel` (creates preview URL)

Set environment variables per environment in Vercel Dashboard → Settings → Environment Variables.

---

**Last Updated:** January 16, 2026
