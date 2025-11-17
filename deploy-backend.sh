#!/bin/bash

# Monday Code Backend Deployment Script
# This script guides you through deploying the magic link backend to Monday Code

set -e

echo "🚀 MONDAY CODE BACKEND DEPLOYMENT"
echo "=================================================================="
echo ""

# Check if Monday CLI is installed
if ! command -v mapps &> /dev/null; then
    echo "❌ Monday Apps CLI not found"
    echo ""
    echo "Installing Monday Apps CLI..."
    npm install -g @mondaycom/apps-cli
    echo "✅ Monday Apps CLI installed"
    echo ""
fi

echo "✅ Monday Apps CLI found: $(mapps --version)"
echo ""

# Check authentication
echo "🔐 Checking Monday authentication..."
if ! mapps whoami &> /dev/null; then
    echo "❌ Not authenticated with Monday"
    echo ""
    echo "Please log in to Monday.com:"
    mapps auth:login
    echo ""
fi

echo "✅ Authenticated with Monday"
echo ""

# Navigate to backend directory
BACKEND_DIR="apps/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"
echo "📂 Current directory: $(pwd)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo "✅ Build complete"
echo ""

# Ask for confirmation
echo "=================================================================="
echo "⚠️  DEPLOYMENT CONFIRMATION"
echo "=================================================================="
echo ""
echo "This will deploy the following functions to Monday Code:"
echo "  - generateMagicLink"
echo "  - verifyMagicLink"
echo "  - webhookHandler (if available)"
echo "  - getTickets (if available)"
echo "  - createTicket (if available)"
echo "  - sendNotification (if available)"
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Deploying to Monday Code..."
echo ""

# Deploy
mapps code:push

echo ""
echo "=================================================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "=================================================================="
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Configure Environment Variables in Monday Code:"
echo "   - Go to Monday.com → Your Workspace → Apps"
echo "   - Find your deployed app"
echo "   - Click 'Configure' → 'Environment Variables'"
echo "   - Add the following:"
echo ""
echo "   PORTAL_BASE_URL = https://portal.redsis.com"
echo "   JWT_SECRET = [generate a strong 32+ character secret]"
echo ""
echo "2. Test the deployment:"
echo "   - Use the test script: node test-magic-link.js"
echo "   - Or use curl to test endpoints directly"
echo ""
echo "3. Get your function URLs:"
echo "   - Go to Monday Code settings to find your app URLs"
echo "   - Format: https://[app-id].monday.com/api/v1/[function-name]"
echo ""
echo "4. Update frontend authentication:"
echo "   - Update API endpoints in client portal"
echo "   - Test magic link flow end-to-end"
echo ""
echo "5. Remove old password columns:"
echo "   - Users board: text_mkxpxyrr"
echo "   - Service Providers board: text_mkxpb7j4"
echo ""
echo "=================================================================="
echo ""
echo "📚 Documentation: See MONDAY_CODE_DEPLOYMENT.md for details"
echo ""
