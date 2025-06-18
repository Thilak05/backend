@echo off
setlocal enabledelayedexpansion

REM ===========================================
REM USASYA BACKEND - PRODUCTION DEPLOYMENT SCRIPT
REM ===========================================

echo 🚀 Usasya Backend - Production Deployment
echo ==========================================

echo 📋 Starting deployment process...

REM 1. Check Node.js version
echo.
echo 1. Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found
    echo Please install Node.js 18+ LTS: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js found: !NODE_VERSION!
)

REM 2. Check npm
echo.
echo 2. Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm found: !NPM_VERSION!
)

REM 3. Install dependencies
echo.
echo 3. Installing dependencies...
npm install --production
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
) else (
    echo ✅ Dependencies installed successfully
)

REM 4. Check environment file
echo.
echo 4. Checking environment configuration...
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env created from .env.example
        echo ⚠️  Please edit .env with your production settings
    ) else (
        echo ❌ .env.example not found
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

REM 5. Check PM2 installation
echo.
echo 5. Checking PM2 installation...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PM2 not found. Installing globally...
    npm install -g pm2
    if errorlevel 1 (
        echo ❌ Failed to install PM2
        pause
        exit /b 1
    ) else (
        echo ✅ PM2 installed successfully
    )
) else (
    for /f "tokens=*" %%i in ('pm2 --version') do set PM2_VERSION=%%i
    echo ✅ PM2 found: !PM2_VERSION!
)

REM 6. Create uploads directory
echo.
echo 6. Creating uploads directory...
if not exist "uploads" mkdir uploads
if not exist "uploads\products" mkdir uploads\products
if not exist "uploads\users" mkdir uploads\users
echo ✅ Uploads directory created

REM 7. Create PM2 ecosystem file
echo.
echo 7. Creating PM2 configuration...
(
echo module.exports = {
echo   apps: [{
echo     name: 'usasya-api',
echo     script: 'server.js',
echo     instances: 1,
echo     autorestart: true,
echo     watch: false,
echo     max_memory_restart: '1G',
echo     env: {
echo       NODE_ENV: 'production',
echo       PORT: 3001
echo     },
echo     error_file: './logs/err.log',
echo     out_file: './logs/out.log',
echo     log_file: './logs/combined.log',
echo     time: true
echo   }]
echo };
) > ecosystem.config.js

if not exist "logs" mkdir logs
echo ✅ PM2 configuration created

REM 8. Start application with PM2
echo.
echo 8. Starting application with PM2...
pm2 start ecosystem.config.js
if errorlevel 1 (
    echo ❌ Failed to start with PM2
    pause
    exit /b 1
) else (
    echo ✅ Application started with PM2
)

REM 9. Setup PM2 startup
echo.
echo 9. Setting up PM2 startup...
pm2 startup
pm2 save
echo ✅ PM2 startup configured

REM 10. Display status
echo.
echo 10. Application Status:
pm2 status

REM 11. Final instructions
echo.
echo 🎉 Deployment Complete!
echo ==========================================
echo 📋 Next Steps:
echo 1. Edit .env file with your production settings
echo 2. Configure Windows Firewall to allow port 3001
echo 3. Set up IIS or Nginx reverse proxy
echo 4. Configure SSL certificate
echo 5. Update frontend API base URL
echo.
echo 📚 Documentation:
echo - README.md - Main documentation
echo - CLOUD_DEPLOYMENT_GUIDE.md - Complete deployment guide
echo - API_DOCUMENTATION_FRONTEND.md - Frontend integration
echo - DEPLOYMENT_CHECKLIST.md - Deployment checklist
echo.
echo 🔧 Useful Commands:
echo - pm2 status        # Check application status
echo - pm2 logs          # View application logs
echo - pm2 restart all   # Restart application
echo - pm2 monit         # Real-time monitoring
echo.
echo 🌐 Application URLs:
echo - Health Check: http://localhost:3001/api/health
echo - API Docs: http://localhost:3001/api/docs
echo.
echo ✅ Your Usasya backend is now running in production mode!

pause
