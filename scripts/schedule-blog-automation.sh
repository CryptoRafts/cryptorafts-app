#!/bin/bash
# Shell script to schedule blog automation on Linux/Mac using cron
# Run: chmod +x scripts/schedule-blog-automation.sh && ./scripts/schedule-blog-automation.sh

set -e

echo "📅 Setting up blog automation schedule..."

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Verify project path
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Project path not found: $PROJECT_DIR"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo "✅ Project path: $PROJECT_DIR"

# Get schedule preference
echo ""
echo "Select schedule:"
echo "1) Daily at 9:00 AM"
echo "2) Daily at 12:00 PM"
echo "3) Daily at 6:00 PM"
echo "4) 3x per week (Mon, Wed, Fri at 9:00 AM)"
echo "5) Weekly (Monday at 9:00 AM)"
echo "6) Custom (enter cron expression)"
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        CRON_SCHEDULE="0 9 * * *"
        SCHEDULE_DESC="Daily at 9:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 12 * * *"
        SCHEDULE_DESC="Daily at 12:00 PM"
        ;;
    3)
        CRON_SCHEDULE="0 18 * * *"
        SCHEDULE_DESC="Daily at 6:00 PM"
        ;;
    4)
        CRON_SCHEDULE="0 9 * * 1,3,5"
        SCHEDULE_DESC="3x per week (Mon, Wed, Fri at 9:00 AM)"
        ;;
    5)
        CRON_SCHEDULE="0 9 * * 1"
        SCHEDULE_DESC="Weekly (Monday at 9:00 AM)"
        ;;
    6)
        read -p "Enter cron expression (e.g., '0 9 * * *'): " CRON_SCHEDULE
        SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Create cron job
CRON_JOB="$CRON_SCHEDULE cd $PROJECT_DIR && npm run blog:generate >> logs/blog-automation.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "blog:generate"; then
    echo "⚠️  Existing cron job found. Removing..."
    crontab -l 2>/dev/null | grep -v "blog:generate" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ Cron job scheduled successfully!"
echo ""
echo "📋 Schedule Details:"
echo "   Schedule: $SCHEDULE_DESC"
echo "   Cron: $CRON_SCHEDULE"
echo "   Command: npm run blog:generate"
echo "   Path: $PROJECT_DIR"
echo "   Logs: $PROJECT_DIR/logs/blog-automation.log"
echo ""
echo "💡 To manage this cron job:"
echo "   - View: crontab -l"
echo "   - Edit: crontab -e"
echo "   - Remove: crontab -l | grep -v 'blog:generate' | crontab -"
echo ""
echo "⚠️  Make sure .env.local is configured with:"
echo "   - OPENAI_API_KEY"
echo "   - N8N_WEBHOOK_URL"
echo "   - DEFAULT_PUBLISH_MODE"
echo ""

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"
echo "✅ Logs directory created: $PROJECT_DIR/logs"

