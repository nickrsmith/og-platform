# Deployment Script for Vercel with Token Support
# Usage: Set $env:VERCEL_TOKEN before running, or pass token as parameter

param(
    [string]$Token = $env:VERCEL_TOKEN
)

Write-Host "🚀 Deploying O&G Dashboard to Vercel..." -ForegroundColor Cyan
Write-Host ""

if (-not $Token) {
    Write-Host "❌ VERCEL_TOKEN not found. Please set it:" -ForegroundColor Red
    Write-Host "   `$env:VERCEL_TOKEN = 'your-token-here'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Or get a token from: https://vercel.com/account/tokens" -ForegroundColor Yellow
    exit 1
}

# Build check
Write-Host "📦 Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Deploy using token
Write-Host "🌐 Deploying to Vercel production..." -ForegroundColor Cyan
$env:VERCEL_TOKEN = $Token
npx vercel deploy --prebuilt --prod --token=$Token --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "🌐 Your app should be live at: https://og-dashboard-peach.vercel.app/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error above." -ForegroundColor Red
    exit 1
}
