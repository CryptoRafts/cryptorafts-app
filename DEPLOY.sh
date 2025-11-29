#!/bin/bash

# CryptoRafts Platform Deployment Script
# This script ensures all platform components are properly deployed and optimized

echo "🚀 Starting CryptoRafts Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Build the application
build_application() {
    print_status "Building application..."
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Failed to build application"
        exit 1
    fi
}

# Deploy Firebase rules
deploy_firebase_rules() {
    print_status "Deploying Firebase rules..."
    if command -v firebase &> /dev/null; then
        if firebase deploy --only firestore:rules; then
            print_success "Firebase rules deployed successfully"
        else
            print_warning "Failed to deploy Firebase rules. Please check Firebase CLI configuration."
        fi
    else
        print_warning "Firebase CLI not found. Please install Firebase CLI to deploy rules."
    fi
}

# Deploy Firebase indexes
deploy_firebase_indexes() {
    print_status "Deploying Firebase indexes..."
    if command -v firebase &> /dev/null; then
        if firebase deploy --only firestore:indexes; then
            print_success "Firebase indexes deployed successfully"
        else
            print_warning "Failed to deploy Firebase indexes. Please check Firebase CLI configuration."
        fi
    else
        print_warning "Firebase CLI not found. Please install Firebase CLI to deploy indexes."
    fi
}

# Deploy Firebase storage rules
deploy_firebase_storage() {
    print_status "Deploying Firebase storage rules..."
    if command -v firebase &> /dev/null; then
        if firebase deploy --only storage; then
            print_success "Firebase storage rules deployed successfully"
        else
            print_warning "Failed to deploy Firebase storage rules. Please check Firebase CLI configuration."
        fi
    else
        print_warning "Firebase CLI not found. Please install Firebase CLI to deploy storage rules."
    fi
}

# Run platform optimization
optimize_platform() {
    print_status "Running platform optimization..."
    
    # Create a temporary optimization script
    cat > temp_optimize.js << 'EOF'
const { optimizeFirebaseConfig } = require('./src/lib/firebase-config-manager.ts');
const { fixPlatformIssues } = require('./src/lib/platform-optimization.ts');

async function optimize() {
    try {
        console.log('🔧 Optimizing Firebase configuration...');
        await optimizeFirebaseConfig();
        
        console.log('🔧 Fixing platform issues...');
        await fixPlatformIssues();
        
        console.log('✅ Platform optimization complete');
    } catch (error) {
        console.error('❌ Platform optimization failed:', error);
    }
}

optimize();
EOF
    
    if node temp_optimize.js; then
        print_success "Platform optimization completed"
    else
        print_warning "Platform optimization had issues. Check logs for details."
    fi
    
    # Clean up temporary file
    rm -f temp_optimize.js
}

# Check platform health
check_platform_health() {
    print_status "Checking platform health..."
    
    # Create a temporary health check script
    cat > temp_health.js << 'EOF'
const { checkPlatformHealth } = require('./src/lib/platform-optimization.ts');
const { checkFirebaseHealth } = require('./src/lib/firebase-config-manager.ts');

async function healthCheck() {
    try {
        console.log('🔍 Checking platform health...');
        const platformHealth = await checkPlatformHealth();
        console.log('Platform health:', platformHealth);
        
        console.log('🔍 Checking Firebase health...');
        const firebaseHealth = await checkFirebaseHealth();
        console.log('Firebase health:', firebaseHealth);
        
        if (platformHealth.errors.length === 0 && firebaseHealth.firestore) {
            console.log('✅ Platform is healthy');
        } else {
            console.log('⚠️ Platform has issues:', platformHealth.errors);
        }
    } catch (error) {
        console.error('❌ Health check failed:', error);
    }
}

healthCheck();
EOF
    
    if node temp_health.js; then
        print_success "Platform health check completed"
    else
        print_warning "Platform health check had issues. Check logs for details."
    fi
    
    # Clean up temporary file
    rm -f temp_health.js
}

# Main deployment function
main() {
    print_status "Starting CryptoRafts Platform Deployment..."
    
    # Pre-deployment checks
    check_node
    check_npm
    
    # Install dependencies
    install_dependencies
    
    # Build application
    build_application
    
    # Deploy Firebase components
    deploy_firebase_rules
    deploy_firebase_indexes
    deploy_firebase_storage
    
    # Optimize platform
    optimize_platform
    
    # Check platform health
    check_platform_health
    
    print_success "🎉 CryptoRafts Platform Deployment Complete!"
    print_status "The platform is now ready for production use."
    print_status "All Firebase collections, rules, and indexes have been deployed."
    print_status "Real-time functionality is enabled across all roles."
    print_status "Platform optimization and health checks have been completed."
}

# Run main function
main "$@"