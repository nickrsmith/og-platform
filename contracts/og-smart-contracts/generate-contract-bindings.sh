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
echo "Generating EmpressaContractFactory bindings..."
jq '.abi' $ARTIFACTS_DIR/EmpressaContractFactory.sol/EmpressaContractFactory.json | abigen --abi - --pkg contracts --type EmpressaContractFactory --out $BINDINGS_DIR/factory.go

echo "Generating EmpressaOrgContract bindings..."
jq '.abi' $ARTIFACTS_DIR/EmpressaOrgContract.sol/EmpressaOrgContract.json | abigen --abi - --pkg contracts --type EmpressaOrgContract --out $BINDINGS_DIR/organization.go

echo "Generating EmpressaLicenseManager bindings..."
jq '.abi' $ARTIFACTS_DIR/EmpressaLicenseManager.sol/EmpressaLicenseManager.json | abigen --abi - --pkg contracts --type EmpressaLicenseManager --out $BINDINGS_DIR/license_manager.go

echo "Generating EmpressaAssetRegistry bindings..."
jq '.abi' $ARTIFACTS_DIR/EmpressaAssetRegistry.sol/EmpressaAssetRegistry.json | abigen --abi - --pkg contracts --type EmpressaAssetRegistry --out $BINDINGS_DIR/asset_registry.go

echo "Generating EmpressaGroupManager bindings..."
jq '.abi' $ARTIFACTS_DIR/EmpressaGroupManager.sol/EmpressaGroupManager.json | abigen --abi - --pkg contracts --type EmpressaGroupManager --out $BINDINGS_DIR/group_manager.go

echo "Generating EmpressaRevenueDistributor bindings..."
jq '.abi' $ARTIFACTS_DIR/EmpressaRevenueDistributor.sol/EmpressaRevenueDistributor.json | abigen --abi - --pkg contracts --type EmpressaRevenueDistributor --out $BINDINGS_DIR/revenue_distributor.go

echo "Generating EmpressaAssetNFT bindings..."
jq '.abi' $ARTIFACTS_DIR/EmpressaAssetNFT.sol/EmpressaAssetNFT.json | abigen --abi - --pkg contracts --type EmpressaAssetNFT --out $BINDINGS_DIR/asset_nft.go

echo "Generating MockUSDC bindings..."
jq '.abi' $ARTIFACTS_DIR/mocks/MockUSDC.sol/MockUSDC.json | abigen --abi - --pkg contracts --type MockUSDC --out $BINDINGS_DIR/usdc.go

echo "✅ Contract bindings generated successfully!"