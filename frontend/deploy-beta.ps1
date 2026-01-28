# Quick Beta Deployment Script for Vercel (PowerShell)

Write-Host "🚀 Deploying O&G Dashboard to Vercel for Beta Testing..." -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if logged in
try {
    $null = vercel whoami 2>&1
} catch {
    Write-Host "🔐 Please login to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Build check
Write-Host "📦 Checking build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Add environment variables in Vercel Dashboard"
Write-Host "2. Test the deployment URL"
Write-Host "3. Share with beta testers"
Write-Host ""
Write-Host "📚 See VERCEL_BETA_DEPLOYMENT.md for details" -ForegroundColor Cyan
