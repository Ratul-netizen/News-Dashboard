@echo off
echo 🚀 News Dashboard Docker Setup
echo ================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install it first.
    pause
    exit /b 1
)

echo ✅ Docker environment check passed

REM Check if external API is accessible
echo 🔍 Checking external API accessibility...
curl -f "http://192.168.100.35:9051/api/posts/?page=1&page_size=1000&platform=F" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ External API is accessible
) else (
    echo ⚠️  Warning: External API not accessible. You may need to update the URL in docker.env
    echo    Current URL: http://192.168.100.35:9051/api/posts/?page=1&page_size=1000&platform=F
    set /p continue="   Do you want to continue anyway? (y/N): "
    if /i not "%continue%"=="y" (
        echo ❌ Setup cancelled. Please update docker.env with the correct API URL.
        pause
        exit /b 1
    )
)

REM Stop any existing containers
echo 🛑 Stopping any existing containers...
docker-compose down

REM Remove old database if it exists
if exist "prisma\dev.db" (
    echo 🗑️  Removing old database...
    del /f "prisma\dev.db"
)

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check status
echo 📊 Checking service status...
docker-compose ps

echo.
echo 🎉 Setup completed!
echo 🌐 Access your dashboard at: http://localhost:3000
echo.
echo 📋 Useful commands:
echo    View logs: docker-compose logs -f news-dashboard
echo    Stop services: docker-compose down
echo    Restart: docker-compose restart
echo    Check status: docker-compose ps
echo.
echo 🔍 To monitor data ingestion:
echo    docker-compose exec news-dashboard tail -f /var/log/cron.log
echo.
echo 📋 To view logs now:
echo    docker-compose logs -f news-dashboard
echo.
pause
