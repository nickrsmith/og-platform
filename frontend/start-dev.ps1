# PowerShell script to start the dev server
# Handles paths with spaces correctly

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting Vite dev server..." -ForegroundColor Green
Write-Host "Dashboard will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""

npm run dev

