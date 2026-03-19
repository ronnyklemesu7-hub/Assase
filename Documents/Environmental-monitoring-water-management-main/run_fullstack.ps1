# EcoGuard Fullstack Runner
# This script starts both the Flask backend and Vite frontend

Write-Host "Starting EcoGuard Fullstack Environment..." -ForegroundColor Cyan

# 1. Start Backend in a new window
Write-Host "Launching Backend API on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python dashboard_api.py"

# 2. Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# 3. Start Frontend
Write-Host "Launching Frontend Dashboard..." -ForegroundColor Green
Set-Location dashboard
cmd /c npm run dev

