# Complete Automated Vercel Deployment
# This script handles everything from authentication to deployment

param(
    [switch]$SkipLogin
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Complete Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check authentication
Write-Host "[1/4] Checking authentication..." -ForegroundColor Yellow
try {
    $authOutput = npx vercel whoami 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -and $authOutput -notmatch "Error|error|not found") {
        Write-Host "  [OK] Already authenticated" -ForegroundColor Green
        $isAuthenticated = $true
    } else {
        Write-Host "  [FAIL] Not authenticated" -ForegroundColor Red
        $isAuthenticated = $false
    }
} catch {
    Write-Host "  [FAIL] Not authenticated" -ForegroundColor Red
    $isAuthenticated = $false
}

if (-not $isAuthenticated) {
    if (-not $SkipLogin) {
        Write-Host ""
        Write-Host "[2/4] Starting authentication..." -ForegroundColor Yellow
        Write-Host "  Please complete login in your browser" -ForegroundColor Cyan
        Write-Host ""
        
        # Run login in background and capture output
        $loginProcess = Start-Process -FilePath "npx" -ArgumentList "vercel", "login" -NoNewWindow -PassThru -Wait
        
        # Give it a moment
        Start-Sleep -Seconds 2
        
        # Check if authenticated now
        $check = npx vercel whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Authentication successful!" -ForegroundColor Green
            $isAuthenticated = $true
        } else {
            Write-Host ""
            Write-Host "  [FAIL] Please authenticate manually:" -ForegroundColor Red
            Write-Host "    npx vercel login" -ForegroundColor White
            Write-Host ""
            Write-Host "  Then run this script again with -SkipLogin" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "  [FAIL] Authentication required" -ForegroundColor Red
        Write-Host "  Run: npx vercel login" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Build
Write-Host ""
Write-Host "[3/4] Building project..." -ForegroundColor Yellow

if (-not (Test-Path "dist\index.html")) {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Build complete" -ForegroundColor Green
} else {
    Write-Host "  [OK] Build exists, using existing build" -ForegroundColor Green
}

# Step 3: Deploy
Write-Host ""
Write-Host "[4/4] Deploying to production..." -ForegroundColor Yellow
Write-Host "  Uploading to Vercel..." -ForegroundColor Cyan

npx vercel deploy --prebuilt --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  [SUCCESS] Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is live at:" -ForegroundColor Cyan
    Write-Host "  https://og-dashboard-peach.vercel.app/" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [FAIL] Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manually:" -ForegroundColor Yellow
    Write-Host "  npx vercel --prod" -ForegroundColor White
    exit 1
}
