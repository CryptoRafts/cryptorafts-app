#!/bin/bash
# Bash Script to Setup Firebase Credentials for Vercel
# Run this: chmod +x setup-vercel-firebase.sh && ./setup-vercel-firebase.sh

echo "🔥 Firebase to Vercel Setup Script"
echo "=================================="
echo ""

# Check if service account file is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-vercel-firebase.sh <path-to-service-account.json>"
    echo ""
    echo "Example:"
    echo "  ./setup-vercel-firebase.sh ~/Downloads/cryptorafts-b9067-firebase-adminsdk.json"
    echo ""
    echo "Download your service account from:"
    echo "https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk"
    exit 1
fi

SERVICE_ACCOUNT_PATH="$1"

# Check if file exists
if [ ! -f "$SERVICE_ACCOUNT_PATH" ]; then
    echo "❌ File not found: $SERVICE_ACCOUNT_PATH"
    echo ""
    echo "Please download it from:"
    echo "https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk"
    exit 1
fi

echo "✅ Found service account file"
echo ""

# Convert to Base64
BASE64_STRING=$(base64 -i "$SERVICE_ACCOUNT_PATH" | tr -d '\n')

if [ $? -ne 0 ]; then
    echo "❌ Error converting to Base64"
    exit 1
fi

echo "✅ Converted to Base64"
echo "   Length: ${#BASE64_STRING} characters"
echo ""

# Copy to clipboard (if available)
if command -v pbcopy &> /dev/null; then
    echo "$BASE64_STRING" | pbcopy
    echo "✅ Copied to clipboard (Mac)!"
elif command -v xclip &> /dev/null; then
    echo "$BASE64_STRING" | xclip -selection clipboard
    echo "✅ Copied to clipboard (Linux)!"
elif command -v clip.exe &> /dev/null; then
    echo "$BASE64_STRING" | clip.exe
    echo "✅ Copied to clipboard (WSL)!"
else
    echo "⚠️  Clipboard not available, saved to file instead"
fi

# Save to file for reference
echo "$BASE64_STRING" > firebase-credentials-base64.txt
echo "✅ Saved to: firebase-credentials-base64.txt"
echo ""

# Display instructions
echo "📋 Next Steps:"
echo "=================================="
echo ""

echo "1. Go to Vercel Dashboard:"
echo "   https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables"
echo ""

echo "2. Click 'Add New' → 'Environment Variable'"
echo ""

echo "3. Set:"
echo "   Name: FIREBASE_SERVICE_ACCOUNT_B64"
echo "   Value: Paste the Base64 string"
echo "   Environments: Select ALL (Production, Preview, Development)"
echo ""

echo "4. Click 'Save'"
echo ""

echo "5. Redeploy:"
echo "   vercel --prod --yes"
echo ""

echo "✨ The Base64 string is in your clipboard (if available)!"
echo "   Just paste it into Vercel!"
echo ""

echo "If clipboard didn't work, copy from: firebase-credentials-base64.txt"
echo ""

