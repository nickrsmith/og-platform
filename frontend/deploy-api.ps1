# Deploy using Vercel API directly
# Requires VERCEL_TOKEN environment variable

$token = $env:VERCEL_TOKEN
$projectId = "prj_XZjS8CQh9VmCK6FZzACRZIkzFhWD"
$orgId = "team_T13ktLBAFmLhoPtb30BzGYMg"

if (-not $token) {
    Write-Host "ERROR: VERCEL_TOKEN not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Get a token from: https://vercel.com/account/tokens" -ForegroundColor Yellow
    Write-Host "Then set: `$env:VERCEL_TOKEN = 'your-token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploying via Vercel API..." -ForegroundColor Cyan

# Create deployment using Vercel API
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "og-dashboard"
    project = $projectId
    target = "production"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" -Method Post -Headers $headers -Body $body
    Write-Host "Deployment created: $($response.url)" -ForegroundColor Green
} catch {
    Write-Host "API Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Falling back to CLI method..." -ForegroundColor Yellow
    npx vercel deploy --prebuilt --prod --token=$token --yes
}
