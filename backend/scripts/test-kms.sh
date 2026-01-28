#!/bin/bash

# AWS KMS Test Script
# This script tests the KMS implementation without requiring AWS

set -e

echo "🧪 Testing AWS KMS Implementation"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if service is running
check_service() {
    info "Checking if KMS service is running..."
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        success "KMS service is running"
        return 0
    else
        error "KMS service is not running on port 3001"
        return 1
    fi
}

# Test 1: Check service health
test_health() {
    echo ""
    echo "Test 1: Service Health Check"
    echo "----------------------------"
    
    if check_service; then
        RESPONSE=$(curl -s http://localhost:3001)
        success "Health check passed"
        echo "Response: $RESPONSE"
    else
        error "Health check failed"
        return 1
    fi
}

# Test 2: Test wallet creation with AWS KMS encryption
test_wallet_creation() {
    echo ""
    echo "Test 2: Wallet Creation"
    echo "----------------------"
    
    TEST_USER_ID=$(uuidgen 2>/dev/null || echo "test-$(date +%s)")
    info "Creating wallet for user: $TEST_USER_ID"
    
    # Create test user in database first
    info "Creating test user in database..."
    docker exec core-backend-db-1 psql -U empressa_dev -d empressa_db -c \
      "INSERT INTO users (id, email, first_name, is_active) VALUES ('$TEST_USER_ID', 'test+$TEST_USER_ID@example.com', 'Test User', true) ON CONFLICT (id) DO NOTHING;" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        success "Test user created successfully"
    else
        warning "Test user may already exist or could not be created"
    fi
    
    RESPONSE=$(curl -s -X POST http://localhost:3001/wallets \
        -H "Content-Type: application/json" \
        -d "{\"userId\": \"$TEST_USER_ID\"}" \
        -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep HTTP_CODE | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | grep -v HTTP_CODE)
    
    if [ "$HTTP_CODE" = "201" ]; then
        success "Wallet created successfully"
        echo "Response: $BODY"
        # Extract wallet address
        WALLET_ADDRESS=$(echo "$BODY" | grep -o '"walletAddress":"[^"]*' | cut -d'"' -f4)
        echo "$WALLET_ADDRESS" > /tmp/test_wallet_address.txt
        echo "$TEST_USER_ID" > /tmp/test_user_id.txt
    else
        error "Failed to create wallet (HTTP $HTTP_CODE)"
        echo "Response: $BODY"
        return 1
    fi
}

# Test 3: Test wallet retrieval
test_wallet_retrieval() {
    echo ""
    echo "Test 3: Wallet Private Key Retrieval"
    echo "------------------------------------"
    
    if [ ! -f /tmp/test_user_id.txt ]; then
        error "No test user ID found. Run wallet creation test first."
        return 1
    fi
    
    TEST_USER_ID=$(cat /tmp/test_user_id.txt)
    info "Retrieving private key for user: $TEST_USER_ID"
    
    RESPONSE=$(curl -s http://localhost:3001/wallets/users/$TEST_USER_ID/private-key \
        -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep HTTP_CODE | cut -d':' -f2)
    PRIVATE_KEY=$(echo "$RESPONSE" | grep -v HTTP_CODE)
    
    if [ "$HTTP_CODE" = "200" ]; then
        success "Private key retrieved successfully"
        # Extract the actual private key value from JSON
        ACTUAL_KEY=$(echo "$PRIVATE_KEY" | grep -o '"privateKey":"[^"]*' | cut -d'"' -f4)
        echo "Private key format: ${ACTUAL_KEY:0:10}..."
        if [[ $ACTUAL_KEY == 0x* ]]; then
            success "Private key format is valid (starts with 0x)"
        else
            error "Private key format is invalid"
            return 1
        fi
    else
        error "Failed to retrieve private key (HTTP $HTTP_CODE)"
        echo "Response: $PRIVATE_KEY"
        return 1
    fi
}

# Test 4: KMS key pool status check
test_kms_status() {
    echo ""
    echo "Test 4: KMS Key Pool Status"
    echo "---------------------------"

    info "Checking KMS key pool status via API..."

    # Query KMS key pool status
    KMS_RESPONSE=$(curl -s http://localhost:3001/kms/status -w "\nHTTP_CODE:%{http_code}")
    HTTP_CODE=$(echo "$KMS_RESPONSE" | grep HTTP_CODE | cut -d':' -f2)
    STATUS_BODY=$(echo "$KMS_RESPONSE" | grep -v HTTP_CODE)

    if [ "$HTTP_CODE" = "200" ]; then
        success "KMS key pool status retrieved successfully"
        echo "Key pool info: $STATUS_BODY"
        
        # Extract active keys count
        if echo "$STATUS_BODY" | grep -q "currentActiveKeys"; then
            # Count keys by counting UUID patterns (key IDs are UUIDs)
            N_KEYS=$(echo "$STATUS_BODY" | grep -o '"currentActiveKeys":\[[^]]*\]' | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | wc -l)
            success "KMS key pool has $N_KEYS active keys"
        else
            info "Key pool structure may vary"
        fi
    else
        error "Failed to retrieve KMS key pool status (HTTP $HTTP_CODE)"
        echo "Response: $STATUS_BODY"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    info "Starting tests..."
    echo ""
    
    # Run tests
    test_health
    test_wallet_creation
    test_wallet_retrieval
    test_kms_status
    
    # Cleanup
    rm -f /tmp/test_wallet_address.txt /tmp/test_user_id.txt
    
    echo ""
    echo "=================================="
    success "All tests completed successfully!"
    echo ""
}

# Run main function
main

