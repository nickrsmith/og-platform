#!/bin/sh

echo "🚀 Starting Empressa Platform with Asset NFTs & NFT Licenses..."
echo ""

# Start Hardhat node in background
echo "🔗 Starting Hardhat node..."
npx hardhat node --hostname 0.0.0.0 > /tmp/hardhat.log 2>&1 &
HARDHAT_PID=$!

# Wait for Hardhat to be ready
echo "⏳ Waiting for Hardhat node to be ready..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8545 > /dev/null; then
    echo "✅ Hardhat node is ready!"
    break
  fi
  sleep 1
done

# Create deployments directory
mkdir -p /app/deployments

# Deploy contracts
echo ""
echo "📦 Deploying contracts..."
npx hardhat run scripts/deploy-Empressa-proxy.js --network localhost

# setup proxy system
echo ""
echo "🔧 Setting up Empressa Proxy System..."
npx hardhat run scripts/setup-proxy-system.js --network localhost

# Fix permissions for NFT system
echo "🔧 Setting up NFT permissions..."
npx hardhat run scripts/fix-permissions.js --network localhost

# Create a simple index.html redirect at root
cat > /app/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/frontend/">
    <title>Empressa NFT Platform</title>
</head>
<body>
    <p>Redirecting to Empressa NFT Platform...</p>
</body>
</html>
EOF

# Start web server
echo ""
echo "🌐 Starting web server on port 3000..."
echo ""
echo "✅ Empressa NFT Platform is ready!"
echo ""
echo "🌐 Access at: http://localhost:3000"
echo "🔗 RPC Endpoint: http://localhost:8545"
echo ""
echo "🎨 Asset NFTs: Each created asset automatically mints an NFT!"
echo ""
echo "📊 To check NFT status, run:"
echo "   docker exec Empressa-nft npx hardhat run scripts/check-nft-setup.js --network localhost"
echo "   docker exec Empressa-nft npx hardhat run scripts/check-nft-count.js --network localhost"
echo ""

# Keep Hardhat running and serve web content
cd /app && exec python3 -m http.server 3000