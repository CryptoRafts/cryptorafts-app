#!/bin/bash
# Bash script to encode Firebase service account JSON to Base64
# Usage: ./scripts/encode-firebase-credentials.sh

echo "🔥 Firebase Service Account Base64 Encoder"
echo ""

# Prompt for JSON file path
read -p "Enter the path to your Firebase service account JSON file: " json_path

# Remove quotes if user included them
json_path=$(echo "$json_path" | sed 's/"//g')

# Check if file exists
if [ ! -f "$json_path" ]; then
    echo "❌ Error: File not found: $json_path"
    exit 1
fi

# Validate JSON (basic check)
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found, skipping JSON validation..."
else
    if jq empty "$json_path" 2>/dev/null; then
        project_id=$(jq -r '.project_id' "$json_path")
        client_email=$(jq -r '.client_email' "$json_path")
        echo "✅ Valid JSON file detected"
        echo "   Project ID: $project_id"
        echo "   Client Email: $client_email"
    else
        echo "⚠️  Warning: File might not be valid JSON, but continuing..."
    fi
fi

# Encode to Base64
echo "🔐 Encoding to Base64..."
base64_output=$(base64 -i "$json_path" 2>/dev/null || base64 "$json_path" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to encode file"
    exit 1
fi

# Copy to clipboard (platform-specific)
if command -v pbcopy &> /dev/null; then
    # macOS
    echo "$base64_output" | pbcopy
    echo ""
    echo "✅ SUCCESS! Base64 encoded credentials copied to clipboard!"
elif command -v xclip &> /dev/null; then
    # Linux with xclip
    echo "$base64_output" | xclip -selection clipboard
    echo ""
    echo "✅ SUCCESS! Base64 encoded credentials copied to clipboard!"
elif command -v xsel &> /dev/null; then
    # Linux with xsel
    echo "$base64_output" | xsel --clipboard --input
    echo ""
    echo "✅ SUCCESS! Base64 encoded credentials copied to clipboard!"
else
    # No clipboard tool available
    echo ""
    echo "✅ SUCCESS! Base64 encoded credentials:"
    echo ""
    echo "$base64_output"
    echo ""
    echo "⚠️  Clipboard not available. Copy the text above manually."
fi

echo ""
echo "📋 Next steps:"
echo "   1. Go to Vercel Dashboard"
echo "   2. Navigate to: Settings → Environment Variables"
echo "   3. Add new variable:"
echo "      Key: FIREBASE_SERVICE_ACCOUNT_B64"
echo "      Value: (paste from clipboard)"
echo "   4. Select all environments (Production, Preview, Development)"
echo "   5. Save and redeploy"
echo ""

# Optionally save to file
read -p "Save Base64 to file? (y/n): " save_to_file
if [ "$save_to_file" = "y" ] || [ "$save_to_file" = "Y" ]; then
    output_path="$(dirname "$json_path")/firebase-credentials-base64.txt"
    echo "$base64_output" > "$output_path"
    echo "✅ Saved to: $output_path"
    echo "⚠️  Remember to delete this file after adding to Vercel!"
fi

