#!/bin/bash

echo ""
echo "========================================"
echo "   RaftAI Service Auto-Fix Script"
echo "========================================"
echo ""

cd raftai-service

echo "[1/5] Stopping any running services..."
pkill -f "node.*raftai" 2>/dev/null || true
sleep 2

echo "[2/5] Cleaning old builds..."
rm -rf dist
rm -rf node_modules/.cache

echo "[3/5] Installing dependencies..."
npm install

echo "[4/5] Building service..."
npm run build

echo ""
echo "========================================"
echo "   Fix Complete! Starting Service..."
echo "========================================"
echo ""
echo "Look for these messages:"
echo "  - RaftAI service listening on port 8080"
echo "  - OPENAI_API_KEY not found (this is OK)"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

npm run dev

