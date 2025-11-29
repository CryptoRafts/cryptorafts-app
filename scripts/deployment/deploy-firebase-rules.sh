#!/bin/bash

# Complete Firebase Rules Deployment Script
# This script deploys comprehensive Firebase rules with admin override

echo "🚀 Starting Firebase Rules Deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase CLI is ready"

# Backup current rules
echo "📦 Backing up current rules..."
if [ -f "firestore.rules" ]; then
    cp firestore.rules firestore.rules.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Firestore rules backed up"
fi

if [ -f "storage.rules" ]; then
    cp storage.rules storage.rules.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Storage rules backed up"
fi

# Deploy complete rules
echo "🔄 Deploying complete Firebase rules..."

# Copy complete rules to main files
if [ -f "firestore.rules.complete" ]; then
    cp firestore.rules.complete firestore.rules
    echo "✅ Firestore rules updated"
else
    echo "❌ firestore.rules.complete not found"
    exit 1
fi

if [ -f "storage.rules.complete" ]; then
    cp storage.rules.complete storage.rules
    echo "✅ Storage rules updated"
else
    echo "❌ storage.rules.complete not found"
    exit 1
fi

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."

# Deploy Firestore rules
echo "📊 Deploying Firestore rules..."
if firebase deploy --only firestore:rules; then
    echo "✅ Firestore rules deployed successfully"
else
    echo "❌ Firestore rules deployment failed"
    exit 1
fi

# Deploy Storage rules
echo "📁 Deploying Storage rules..."
if firebase deploy --only storage; then
    echo "✅ Storage rules deployed successfully"
else
    echo "❌ Storage rules deployment failed"
    exit 1
fi

echo "🎉 Firebase rules deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  ✅ Firestore rules deployed with admin override"
echo "  ✅ Storage rules deployed with admin override"
echo "  ✅ All user roles supported (Admin, VC, Founder, Exchange, Agency, Influencer)"
echo "  ✅ Complete security with role-based access control"
echo ""
echo "🔍 Next steps:"
echo "  1. Test the rules in Firebase console"
echo "  2. Verify admin access works correctly"
echo "  3. Test role-based access for each user type"
echo "  4. Monitor for any permission issues"
echo ""
echo "📚 Documentation: firebase-rules-deployment.md"
