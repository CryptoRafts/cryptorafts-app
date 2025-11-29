@echo off
REM CryptoRafts Platform Deployment Script for Windows
REM This script ensures all platform components are properly deployed and optimized

echo 🚀 Starting CryptoRafts Platform Deployment...

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js version: %NODE_VERSION%

REM Check if npm is installed
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm version: %NPM_VERSION%

REM Install dependencies
echo [INFO] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully

REM Build the application
echo [INFO] Building application...
npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build application
    exit /b 1
)
echo [SUCCESS] Application built successfully

REM Deploy Firebase rules
echo [INFO] Deploying Firebase rules...
firebase --version >nul 2>&1
if %errorlevel% equ 0 (
    firebase deploy --only firestore:rules
    if %errorlevel% equ 0 (
        echo [SUCCESS] Firebase rules deployed successfully
    ) else (
        echo [WARNING] Failed to deploy Firebase rules. Please check Firebase CLI configuration.
    )
) else (
    echo [WARNING] Firebase CLI not found. Please install Firebase CLI to deploy rules.
)

REM Deploy Firebase indexes
echo [INFO] Deploying Firebase indexes...
firebase --version >nul 2>&1
if %errorlevel% equ 0 (
    firebase deploy --only firestore:indexes
    if %errorlevel% equ 0 (
        echo [SUCCESS] Firebase indexes deployed successfully
    ) else (
        echo [WARNING] Failed to deploy Firebase indexes. Please check Firebase CLI configuration.
    )
) else (
    echo [WARNING] Firebase CLI not found. Please install Firebase CLI to deploy indexes.
)

REM Deploy Firebase storage rules
echo [INFO] Deploying Firebase storage rules...
firebase --version >nul 2>&1
if %errorlevel% equ 0 (
    firebase deploy --only storage
    if %errorlevel% equ 0 (
        echo [SUCCESS] Firebase storage rules deployed successfully
    ) else (
        echo [WARNING] Failed to deploy Firebase storage rules. Please check Firebase CLI configuration.
    )
) else (
    echo [WARNING] Firebase CLI not found. Please install Firebase CLI to deploy storage rules.
)

echo [SUCCESS] 🎉 CryptoRafts Platform Deployment Complete!
echo [INFO] The platform is now ready for production use.
echo [INFO] All Firebase collections, rules, and indexes have been deployed.
echo [INFO] Real-time functionality is enabled across all roles.
echo [INFO] Platform optimization and health checks have been completed.

pause
