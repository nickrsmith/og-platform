#!/bin/bash

# KMS Service Start Script
# This script ensures a clean start by killing old processes

echo "🔧 Preparing to start KMS service..."
echo ""

# Kill any existing processes on port 3001
echo "Cleaning up old processes..."
lsof -ti :3001 | xargs kill -9 2>/dev/null || echo "No old processes to kill"

# Wait a moment for port to be released
sleep 2

# Check port is free
if lsof -ti :3001 > /dev/null 2>&1; then
    echo "❌ Port 3001 is still in use. Please check manually:"
    echo "   lsof -i :3001"
    exit 1
fi

echo "✅ Port 3001 is free"
echo ""

# Start the service
echo "Starting KMS service..."
echo ""

# Start in background and log
cd /home/ubuntu/Documents/core-backend
nohup pnpm start:dev:kms > /tmp/kms-service.log 2>&1 &

# Get the PID
SERVICE_PID=$!
echo "Service started with PID: $SERVICE_PID"
echo ""

# Wait for service to initialize
echo "Waiting for service to initialize..."
for i in {1..20}; do
    sleep 1
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ KMS service is running on port 3001"
        echo ""
        echo "📋 To view logs:"
        echo "   tail -f /tmp/kms-service.log"
        echo ""
        echo "📋 To stop the service:"
        echo "   kill $SERVICE_PID"
        echo ""
        exit 0
    fi
done

echo "⚠️  Service may not have started properly. Check logs:"
echo "   tail -50 /tmp/kms-service.log"
exit 1

