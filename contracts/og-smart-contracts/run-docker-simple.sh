#!/bin/bash

echo "🐳 Simple Docker Setup for Hauska NFT Platform with Asset NFTs & Block Explorer"
echo "=============================================================================="
echo ""
echo "✨ Features:"
echo "   - Asset NFTs: Each asset mints an NFT automatically"
echo "   - License NFTs: Licenses are also NFTs"
echo "   - Block Explorer: View transactions and contracts"
echo ""

# Stop and remove any existing containers
echo "🧹 Cleaning up existing containers..."
docker stop hauska-nft 2>/dev/null || true
docker rm hauska-nft 2>/dev/null || true
docker stop hauska-explorer 2>/dev/null || true
docker rm hauska-explorer 2>/dev/null || true

# Create a network for containers to communicate
echo "🌐 Creating Docker network..."
docker network create hauska-network 2>/dev/null || true

# Build the Docker image (always rebuild)
echo "🔨 Building Docker image (fresh build with Asset NFT support)..."
docker build -f Dockerfile.simple -t hauska-nft . --no-cache

# Verify the build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Docker build failed. Please check the error messages above."
    exit 1
fi

# Start block explorer in background
echo "🔍 Starting block explorer..."
docker run -d \
  --name hauska-explorer \
  --network hauska-network \
  -p 3001:80 \
  -e REACT_APP_ETH_RPC_URL=http://hauska-nft:8545 \
  -e REACT_APP_SERVICE_RPC=http://hauska-nft:8545 \
  -e REACT_APP_DEFAULT_SERVICE_RPC=http://hauska-nft:8545 \
  etclabscore/expedition:latest

# Wait a moment for explorer to start
sleep 2

echo ""
echo "🚀 Starting Hauska platform with Asset NFTs..."
echo ""
echo "✅ Services available at:"
echo "   📱 Frontend:       http://localhost:3000"
echo "   🔍 Block Explorer: http://localhost:3001"
echo "   🔗 RPC Endpoint:   http://localhost:8545"
echo ""
echo "🎨 Asset NFT Features:"
echo "   - Every asset created mints an NFT automatically"
echo "   - NFTs are ERC-721 compliant and show in wallets"
echo "   - Transfer assets = Transfer NFTs"
echo "   - View NFT ownership status in the UI"
echo ""
echo "📝 Block Explorer Notes:"
echo "   - The explorer is pre-configured to use the local RPC"
echo "   - You can see NFT mint transactions in the explorer"
echo "   - For full NFT metadata support, run: ./run-blockscout.sh"
echo ""
echo "🔧 Useful Commands:"
echo "   Check NFT setup:  docker exec hauska-nft npx hardhat run scripts/check-nft-setup.js --network localhost"
echo "   Test Asset NFT:   docker exec hauska-nft npx hardhat run scripts/test-asset-nft.js --network localhost"
echo ""

echo "⏳ Please wait while contracts are being deployed..."
echo "   This includes:"
echo "   - HauskaContractFactory"
echo "   - HauskaAssetNFT (NEW!)"
echo "   - HauskaLicenseManager"
echo "   - HauskaAssetRegistry"
echo "   - And other modules..."
echo ""

# Run the main container
docker run -it --rm \
  -p 8545:8545 \
  -p 3000:3000 \
  --name hauska-nft \
  --network hauska-network \
  hauska-nft