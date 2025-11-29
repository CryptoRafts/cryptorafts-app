#!/bin/bash
# Test Production Build Locally

set -e

echo "=========================================="
echo "TESTING PRODUCTION BUILD LOCALLY"
echo "=========================================="
echo ""

# 1. Build production
echo "Step 1: Building production..."
npm run build
echo "✅ Build complete"
echo ""

# 2. Start production server
echo "Step 2: Starting production server..."
echo "Server will start on http://localhost:3000"
echo ""
echo "⚠️  IMPORTANT: Keep this terminal open and check the browser console (F12) for errors"
echo ""
echo "Press Ctrl+C to stop the server when done testing"
echo ""

# Start server in background and capture output
npm run start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:3000"
    echo ""
    echo "=========================================="
    echo "TESTING CHECKLIST"
    echo "=========================================="
    echo ""
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Press F12 to open DevTools"
    echo "3. Go to Console tab"
    echo "4. Look for:"
    echo "   - Hydration errors (red)"
    echo "   - Mismatch warnings (yellow)"
    echo "   - Any React errors"
    echo "5. Go to Elements tab"
    echo "6. Check if hero content is visible in HTML"
    echo "7. Check if CSS classes are applied"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Wait for user to stop
    wait $SERVER_PID
else
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

