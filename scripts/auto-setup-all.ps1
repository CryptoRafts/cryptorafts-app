# Master Automation Script - Sets up everything automatically
# This script runs all setup scripts in sequence

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Email & DNS Setup Automation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run complete email setup
Write-Host "Running complete email setup..." -ForegroundColor Yellow
& ".\scripts\complete-email-setup.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All automated steps completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files Created:" -ForegroundColor Yellow
Write-Host "  - DNS_RECORDS_TO_ADD.txt (DNS records to add)" -ForegroundColor White
Write-Host "  - HOSTINGER_SETUP_INSTRUCTIONS.txt (Email account setup)" -ForegroundColor White
Write-Host ""
Write-Host "Next: Follow the instructions in the files above" -ForegroundColor Cyan
Write-Host ""

