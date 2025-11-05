# Quick Docker Rebuild Script for Windows PowerShell
Write-Host "🛠️  Rebuilding Docker container..." -ForegroundColor Cyan

Write-Host "`n📦 Stopping container..." -ForegroundColor Yellow
docker-compose down

Write-Host "`n🔨 Rebuilding image (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host "`n🚀 Starting container..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`n✅ Rebuild complete! Checking status..." -ForegroundColor Green
docker-compose ps

Write-Host "`n📋 Viewing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
docker-compose logs -f news-dashboard

