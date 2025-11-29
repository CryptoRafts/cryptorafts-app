# PowerShell script to schedule blog automation on Windows
# Run this script as Administrator to create a scheduled task

param(
    [string]$Schedule = "Daily",  # Daily, Weekly, or Hourly
    [string]$Time = "09:00",      # Time in HH:mm format
    [string]$ProjectPath = $PSScriptRoot + "\.."
)

Write-Host "📅 Setting up blog automation schedule..." -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Get Node.js path
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Get npm path
$npmPath = (Get-Command npm -ErrorAction SilentlyContinue).Source
if (-not $npmPath) {
    Write-Host "❌ npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Verify project path
if (-not (Test-Path "$ProjectPath\package.json")) {
    Write-Host "❌ Project path not found: $ProjectPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js found: $nodePath" -ForegroundColor Green
Write-Host "✅ Project path: $ProjectPath" -ForegroundColor Green

# Create scheduled task
$taskName = "CryptoraftsBlogAutomation"
$taskDescription = "Automatically generates blog posts using OpenAI and sends to n8n webhook"

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "⚠️  Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create action (run npm script)
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "run blog:generate" -WorkingDirectory $ProjectPath

# Create trigger based on schedule
switch ($Schedule) {
    "Daily" {
        $trigger = New-ScheduledTaskTrigger -Daily -At $Time
        Write-Host "📅 Schedule: Daily at $Time" -ForegroundColor Cyan
    }
    "Weekly" {
        $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At $Time
        Write-Host "📅 Schedule: Weekly on Monday at $Time" -ForegroundColor Cyan
    }
    "Hourly" {
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
        Write-Host "📅 Schedule: Hourly" -ForegroundColor Cyan
    }
    default {
        Write-Host "❌ Invalid schedule: $Schedule. Use Daily, Weekly, or Hourly" -ForegroundColor Red
        exit 1
    }
}

# Create settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Create principal (run as current user)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

# Register task
try {
    Register-ScheduledTask -TaskName $taskName -Description $taskDescription -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $taskName"
    Write-Host "   Schedule: $Schedule"
    Write-Host "   Time: $Time"
    Write-Host "   Command: npm run blog:generate"
    Write-Host "   Path: $ProjectPath"
    Write-Host ""
    Write-Host "💡 To manage this task:" -ForegroundColor Yellow
    Write-Host "   - View: Get-ScheduledTask -TaskName $taskName"
    Write-Host "   - Run now: Start-ScheduledTask -TaskName $taskName"
    Write-Host "   - Remove: Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
    Write-Host ""
    Write-Host "⚠️  Make sure .env.local is configured with:" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY"
    Write-Host "   - N8N_WEBHOOK_URL"
    Write-Host "   - DEFAULT_PUBLISH_MODE"
} catch {
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    exit 1
}

