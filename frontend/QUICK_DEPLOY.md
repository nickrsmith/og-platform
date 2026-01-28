# Quick Deploy to Vercel

Your project is already linked to Vercel (project: `og-dashboard`).

## Option 1: Using Vercel CLI (Recommended)

1. **Authenticate** (one-time setup):
   ```powershell
   cd p:\og_application\frontend
   npx vercel login
   ```
   Follow the browser prompts to authenticate.

2. **Deploy**:
   ```powershell
   npx vercel --prod
   ```

## Option 2: Using Token

1. **Get a token** from: https://vercel.com/account/tokens

2. **Deploy with token**:
   ```powershell
   cd p:\og_application\frontend
   $env:VERCEL_TOKEN = "your-token-here"
   npx vercel deploy --prebuilt --prod --token=$env:VERCEL_TOKEN --yes
   ```

## Option 3: Using the Script

Run the deployment script:
```powershell
cd p:\og_application\frontend
.\deploy-with-token.ps1
```

(You'll need to set `$env:VERCEL_TOKEN` first)

---

**Note**: The build is already complete in the `dist` folder. You can use `--prebuilt` flag to skip rebuilding.
