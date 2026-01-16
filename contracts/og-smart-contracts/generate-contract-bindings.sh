#!/bin/bash

# Generate bindings
echo "🔧 Generating contract bindings..."
ARTIFACTS_DIR="./artifacts/contracts"
BINDINGS_DIR="./bindings"

# Check if artifacts directory exists
if [ ! -d "$ARTIFACTS_DIR" ]; then
    echo "❌ Error: Artifacts directory not found at $ARTIFACTS_DIR"
    echo "   Please make sure you've compiled the contracts first by running:"
    echo "   npx hardhat compile"
    echo "   from the project root directory"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required to extract ABI from Hardhat artifacts"
    echo "   Please install jq: sudo apt-get install jq"
    exit 1
fi

mkdir -p $BINDINGS_DIR

# Generate all contract bindings
echo "Generating HauskaContractFactory bindings..."
jq '.abi' $ARTIFACTS_DIR/HauskaContractFactory.sol/HauskaContractFactory.json | abigen --abi - --pkg contracts --type HauskaContractFactory --out $BINDINGS_DIR/factory.go

echo "Generating HauskaOrgContract bindings..."
jq '.abi' $ARTIFACTS_DIR/HauskaOrgContract.sol/HauskaOrgContract.json | abigen --abi - --pkg contracts --type HauskaOrgContract --out $BINDINGS_DIR/organization.go

echo "Generating HauskaLicenseManager bindings..."
jq '.abi' $ARTIFACTS_DIR/HauskaLicenseManager.sol/HauskaLicenseManager.json | abigen --abi - --pkg contracts --type HauskaLicenseManager --out $BINDINGS_DIR/license_manager.go

echo "Generating HauskaAssetRegistry bindings..."
jq '.abi' $ARTIFACTS_DIR/HauskaAssetRegistry.sol/HauskaAssetRegistry.json | abigen --abi - --pkg contracts --type HauskaAssetRegistry --out $BINDINGS_DIR/asset_registry.go

echo "Generating HauskaGroupManager bindings..."
jq '.abi' $ARTIFACTS_DIR/HauskaGroupManager.sol/HauskaGroupManager.json | abigen --abi - --pkg contracts --type HauskaGroupManager --out $BINDINGS_DIR/group_manager.go

echo "Generating HauskaRevenueDistributor bindings..."
jq '.abi' $ARTIFACTS_DIR/HauskaRevenueDistributor.sol/HauskaRevenueDistributor.json | abigen --abi - --pkg contracts --type HauskaRevenueDistributor --out $BINDINGS_DIR/revenue_distributor.go

echo "Generating HauskaAssetNFT bindings..."
jq '.abi' $ARTIFACTS_DIR/HauskaAssetNFT.sol/HauskaAssetNFT.json | abigen --abi - --pkg contracts --type HauskaAssetNFT --out $BINDINGS_DIR/asset_nft.go

echo "Generating MockUSDC bindings..."
jq '.abi' $ARTIFACTS_DIR/mocks/MockUSDC.sol/MockUSDC.json | abigen --abi - --pkg contracts --type MockUSDC --out $BINDINGS_DIR/usdc.go

echo "✅ Contract bindings generated successfully!"