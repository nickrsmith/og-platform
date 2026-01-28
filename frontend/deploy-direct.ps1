# Direct Vercel Deployment Script
# Attempts to deploy using Vercel API directly

$projectId = "prj_XZjS8CQh9VmCK6FZzACRZIkzFhWD"
$orgId = "team_T13ktLBAFmLhoPtb30BzGYMg"
$token = $env:VERCEL_TOKEN

if (-not $token) {
    Write-Host "❌ VERCEL_TOKEN environment variable not set." -ForegroundColor Red
    Write-Host ""
    Write-Host "To deploy, you need to:" -ForegroundColor Yellow
    Write-Host "1. Get a token from: https://vercel.com/account/tokens" -ForegroundColor Cyan
    Write-Host "2. Set it: `$env:VERCEL_TOKEN = 'your-token'" -ForegroundColor Cyan
    Write-Host "3. Run this script again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternatively, run: npx vercel login" -ForegroundColor Yellow
    Write-Host "Then: npx vercel --prod" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan

# Ensure build exists
if (-not (Test-Path "dist")) {
    Write-Host "📦 Building project..." -ForegroundColor Cyan
    npm run build
}

# Use Vercel CLI with token
Write-Host "🌐 Uploading to Vercel..." -ForegroundColor Cyan
$env:VERCEL_TOKEN = $token
npx vercel deploy --prebuilt --prod --token=$token --yes
