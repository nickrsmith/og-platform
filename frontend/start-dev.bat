@echo off
REM Batch script to start the dev server
REM Handles paths with spaces correctly

cd /d "%~dp0"
echo Starting Vite dev server...
echo Dashboard will be available at: http://localhost:5000
echo.
npm run dev
pause

