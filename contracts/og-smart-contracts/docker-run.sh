#!/bin/bash

echo "🐳 Hauska Smart Contracts - Docker Setup"
echo "========================================"
echo ""
echo "This will build and run the Hauska platform with NFT License System"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Hauska platform is running!"
echo ""
echo "🌐 Access Points:"
echo "   Frontend: http://localhost:3000"
echo "   Hardhat Node: http://localhost:8545"
echo ""
echo "📝 Useful Commands:"
echo "   View logs: docker-compose logs -f hauska"
echo "   Check NFTs: docker-compose exec hauska npx hardhat run scripts/check-nft-count.js --network localhost"
echo "   Stop services: docker-compose down"
echo ""
echo "🎫 NFT License System is active - each license purchase mints an ERC-721 NFT!"