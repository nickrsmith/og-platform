# Automated Vercel Deployment Script
# This script handles authentication and deployment automatically

Write-Host "Automated Vercel Deployment" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Step 1: Check if already authenticated
Write-Host "Checking authentication..." -ForegroundColor Cyan
$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Already authenticated as: $whoami" -ForegroundColor Green
    $authenticated = $true
} else {
    Write-Host "Not authenticated. Login required." -ForegroundColor Yellow
    $authenticated = $false
}

# Step 2: Build if needed
if (-not (Test-Path "dist\index.html")) {
    Write-Host ""
    Write-Host "Building project..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build complete!" -ForegroundColor Green
} else {
    Write-Host "Build already exists" -ForegroundColor Green
}

# Step 3: Deploy
Write-Host ""
if ($authenticated) {
    Write-Host "Deploying to production..." -ForegroundColor Cyan
    npx vercel deploy --prebuilt --prod --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host "Your app: https://og-dashboard-peach.vercel.app/" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Deployment failed. Error code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Try running manually:" -ForegroundColor Yellow
        Write-Host "   npx vercel login" -ForegroundColor White
        Write-Host "   npx vercel --prod" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "Authentication required before deployment." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run:" -ForegroundColor Cyan
    Write-Host "   npx vercel login" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again, or deploy directly with:" -ForegroundColor Cyan
    Write-Host "   npx vercel --prod" -ForegroundColor White
    exit 1
}
