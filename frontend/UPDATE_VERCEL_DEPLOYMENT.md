# Update Vercel Deployment - Quick Guide

Your app is currently deployed at: **https://og-dashboard-peach.vercel.app/**

## Project Configuration

- **Project Name:** og-dashboard
- **Project ID:** prj_XZjS8CQh9VmCK6FZzACRZIkzFhWD
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## How to Update the Deployment

### Option 1: Git Integration (Automatic - Recommended)

If your Git repository is connected to Vercel:

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Update UI with latest changes"
   git push
   ```

2. **Vercel automatically deploys:**
   - Vercel detects the push
   - Runs `npm run build` automatically
   - Deploys to production
   - Your site updates at https://og-dashboard-peach.vercel.app/

### Option 2: Manual Deploy via Vercel CLI

If you want to deploy manually:

```bash
# Navigate to frontend directory
cd frontend

# Deploy to production
vercel --prod

# Or deploy as preview first
vercel
```

### Option 3: Redeploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Find your project: **og-dashboard**
3. Click on the latest deployment
4. Click "Redeploy" → "Use Existing Build Cache" (optional)
5. Click "Redeploy"

## What's Being Deployed

The latest build includes:
- ✅ Updated `vercel.json` with caching headers
- ✅ All UI changes from today's work (Land Admin, JIB Decks, etc.)
- ✅ Latest frontend code in `frontend/dist/`

## Verify the Deployment

After deployment:

1. Check the deployment status in Vercel Dashboard
2. Visit https://og-dashboard-peach.vercel.app/
3. Test key pages:
   - `/` - Homepage
   - `/marketplace` - Asset listings
   - `/phase2/suspense` - Suspense Management (new)
   - `/phase2/jib-decks` - JIB Decks (enhanced)
   - `/phase2/leases` - Leases (with Add Lease flow)

## Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

- `VITE_API_BASE_URL` - Your backend API URL (e.g., `https://api.yourdomain.com` or `https://your-backend.herokuapp.com`)
- `VITE_USE_MOCK_API` - Set to `false` for production (set to `true` only for testing without backend)
- `VITE_WEB3AUTH_CLIENT_ID` - If using Web3Auth
- `VITE_WEB3AUTH_NETWORK` - `mainnet` or `testnet`

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify `npm run build` works locally first
- Check Node.js version (currently set to 24.x)

### Changes Not Reflecting
- Clear browser cache
- Check deployment logs for errors
- Verify environment variables are correct

### Need to Rollback
- Go to Vercel Dashboard → Deployments
- Find the previous working deployment
- Click "Promote to Production"

---

**Current Deployment URL:** https://og-dashboard-peach.vercel.app/

---

## Enabling File Uploads and QA Testing from Vercel

To enable file uploads and QA testing from your Vercel-deployed frontend, you need to configure both the frontend (Vercel) and backend:

### Prerequisites

1. **Backend API must be deployed and accessible** - The backend cannot run on Vercel (it needs persistent storage and long-running processes). You need to deploy it to:
   - AWS ECS/Fargate
   - Heroku
   - Railway
   - DigitalOcean App Platform
   - Any platform that supports Docker containers with persistent storage

2. **Backend services required:**
   - Core API (NestJS) - handles file uploads
   - IPFS Service - processes and uploads files to IPFS
   - PostgreSQL Database
   - Redis (for queues)
   - RabbitMQ (for message queues)

### Step 1: Configure Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables, set:

```bash
# Required: Point to your deployed backend API
VITE_API_BASE_URL=https://your-backend-api.com

# Required: Disable mock API for real file uploads
VITE_USE_MOCK_API=false

# Optional: Web3Auth configuration
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_WEB3AUTH_NETWORK=mainnet  # or 'testnet'
```

**Important:** After adding/updating environment variables, you must **redeploy** your Vercel app for changes to take effect.

### Step 2: Configure Backend CORS

Your backend needs to allow requests from your Vercel domain. Update your backend environment variables:

```bash
# In your backend deployment (e.g., AWS ECS, Heroku, etc.)
ROYALTY_MARKETPLACE_URL=https://og-dashboard-peach.vercel.app
# OR
ADMIN_DASHBOARD_URL=https://og-dashboard-peach.vercel.app
```

The backend CORS configuration (in `backend/apps/core-api/src/main.ts`) will automatically allow requests from these URLs.

**For production, you may want to set both:**
```bash
ROYALTY_MARKETPLACE_URL=https://og-dashboard-peach.vercel.app
ADMIN_DASHBOARD_URL=https://og-dashboard-peach.vercel.app
```

### Step 3: Verify Backend File Upload Endpoints

Ensure your backend has these endpoints accessible:

- `POST /api/v1/data-rooms/:id/documents` - Upload documents to data rooms
- `POST /api/v1/releases/:releaseId/files` - Upload release files
- `POST /api/v1/organizations/:id/logo` - Upload organization logos

Test the backend health endpoint:
```bash
curl https://your-backend-api.com/api/health
```

### Step 4: Test File Uploads

1. **Access your Vercel app:** https://og-dashboard-peach.vercel.app/
2. **Login** with your credentials
3. **Test file upload in these areas:**
   - **Data Rooms:** Create a data room and upload documents
   - **Create Listing:** Upload required documents when creating a listing
   - **Identity Verification:** Upload ID documents
   - **Organization Settings:** Upload organization logo

### Step 5: QA Testing Checklist

Test these file upload scenarios:

- [ ] Upload PDF documents to data rooms
- [ ] Upload images (thumbnails, logos)
- [ ] Upload multiple files at once
- [ ] Verify files appear after upload
- [ ] Test file size limits (max 750MB per file)
- [ ] Test error handling (network failures, invalid files)
- [ ] Verify files are processed and stored in IPFS
- [ ] Test file downloads/viewing

### Troubleshooting File Uploads

#### Upload Fails with CORS Error

**Symptom:** Browser console shows CORS error when uploading files.

**Solution:**
1. Verify `ROYALTY_MARKETPLACE_URL` or `ADMIN_DASHBOARD_URL` is set in backend with your Vercel URL
2. Restart your backend service after updating environment variables
3. Check backend logs for CORS rejection messages

#### Upload Fails with 401 Unauthorized

**Symptom:** Upload request returns 401 error.

**Solution:**
1. Ensure you're logged in to the Vercel app
2. Check that JWT token is being sent in Authorization header
3. Verify backend authentication is working: `curl -H "Authorization: Bearer YOUR_TOKEN" https://your-backend-api.com/api/v1/auth/user`

#### Upload Fails with Network Error

**Symptom:** Network error or connection refused.

**Solution:**
1. Verify `VITE_API_BASE_URL` is set correctly in Vercel
2. Check that backend is accessible from the internet (not just localhost)
3. Test backend health endpoint: `curl https://your-backend-api.com/api/health`
4. Check backend logs for errors

#### Files Upload But Don't Appear

**Symptom:** Upload succeeds but files don't show in UI.

**Solution:**
1. Check backend IPFS service is running and processing files
2. Verify database connection is working
3. Check backend logs for IPFS upload errors
4. Verify file processing queue (BullMQ) is running

### Backend Deployment Options

If you haven't deployed your backend yet, here are recommended options:

#### Option 1: AWS ECS/Fargate (Recommended for Production)
- Supports Docker containers
- Persistent storage via EFS
- Auto-scaling
- See `backend/docker-compose.prod.yml` for reference

#### Option 2: Heroku
- Easy deployment
- Add-ons for PostgreSQL, Redis
- File storage limitations (use S3 for temp files)

#### Option 3: Railway
- Simple Docker deployment
- Built-in PostgreSQL and Redis
- Persistent volumes for file storage

#### Option 4: DigitalOcean App Platform
- Docker support
- Managed databases
- Persistent storage options

### Quick Test Script

To quickly test if your setup is working:

```bash
# 1. Test backend is accessible
curl https://your-backend-api.com/api/health

# 2. Test CORS (from browser console on Vercel app)
fetch('https://your-backend-api.com/api/v1/health', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)

# 3. Test file upload endpoint (requires auth token)
# Use browser DevTools Network tab to copy your auth token
curl -X POST https://your-backend-api.com/api/v1/data-rooms/TEST_ID/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
```

### Next Steps

Once file uploads are working:

1. **Monitor uploads:** Check backend logs and IPFS service status
2. **Set up error alerts:** Configure monitoring for failed uploads
3. **Optimize performance:** Consider CDN for file serving
4. **Security:** Review file type validation and size limits
