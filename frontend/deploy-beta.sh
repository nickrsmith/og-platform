#!/bin/bash
# Quick Beta Deployment Script for Vercel

echo "🚀 Deploying O&G Dashboard to Vercel for Beta Testing..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Build check
echo "📦 Checking build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add environment variables in Vercel Dashboard"
echo "2. Test the deployment URL"
echo "3. Share with beta testers"
echo ""
echo "📚 See VERCEL_BETA_DEPLOYMENT.md for details"
