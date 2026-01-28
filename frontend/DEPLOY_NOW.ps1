# ONE-COMMAND DEPLOYMENT TO VERCEL
# Run this script to deploy your UI updates

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERCEL DEPLOYMENT" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if authenticated
Write-Host "Step 1: Checking authentication..." -ForegroundColor Yellow
$whoami = npx vercel whoami 2>&1
$authenticated = $LASTEXITCODE -eq 0

if (-not $authenticated) {
    Write-Host "  Authentication required!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Opening login process..." -ForegroundColor Cyan
    Write-Host "  Please complete the login in your browser window." -ForegroundColor Yellow
    Write-Host ""
    
    # Start login
    npx vercel login
    
    # Check again
    $whoami = npx vercel whoami 2>&1
    $authenticated = $LASTEXITCODE -eq 0
    
    if (-not $authenticated) {
        Write-Host ""
        Write-Host "  Login not completed. Please try again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "  Authenticated!" -ForegroundColor Green
Write-Host ""

# Build
Write-Host "Step 2: Building project..." -ForegroundColor Yellow
if (-not (Test-Path "dist\index.html")) {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Build failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Build ready!" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Step 3: Deploying to production..." -ForegroundColor Yellow
Write-Host "  Uploading to Vercel..." -ForegroundColor Cyan
npx vercel deploy --prebuilt --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your UI updates are live at:" -ForegroundColor Cyan
    Write-Host "  https://og-dashboard-peach.vercel.app/" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  Deployment failed. Try: npx vercel --prod" -ForegroundColor Red
    exit 1
}
