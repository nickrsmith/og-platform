#!/bin/bash
# Setup script for git-secrets (optional enhanced secret scanning)
# This script helps set up git-secrets for additional secret detection

set -e

echo "🔐 Setting up git-secrets for enhanced secret scanning..."

# Check if git-secrets is installed
if ! command -v git-secrets &> /dev/null; then
  echo "⚠️  git-secrets is not installed."
  echo ""
  echo "To install git-secrets:"
  echo "  macOS: brew install git-secrets"
  echo "  Linux: See https://github.com/awslabs/git-secrets#installing"
  echo ""
  echo "After installing, run this script again."
  exit 1
fi

# Navigate to repository root
cd "$(git rev-parse --show-toplevel)"

# Install git-secrets hooks
echo "Installing git-secrets hooks..."
git secrets --install

# Register AWS patterns
echo "Registering AWS credential patterns..."
git secrets --register-aws

# Register common secret patterns
echo "Registering common secret patterns..."

# API Keys
git secrets --add 'AKIA[0-9A-Z]{16}'
git secrets --add 'sk_live_[a-zA-Z0-9]{24,}'

# GitHub tokens
git secrets --add 'ghp_[a-zA-Z0-9]{36}'
git secrets --add 'gho_[a-zA-Z0-9]{36}'
git secrets --add 'ghu_[a-zA-Z0-9]{36}'
git secrets --add 'ghs_[a-zA-Z0-9]{36}'
git secrets --add 'ghr_[a-zA-Z0-9]{36}'

# Slack tokens
git secrets --add 'xox[baprs]-[0-9a-zA-Z-]{10,}'

# Private keys
git secrets --add 'BEGIN (RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY'

# Allow test files (add patterns that should be allowed)
echo "Configuring allowed patterns for test files..."
git secrets --add --allowed 'test.*secret'
git secrets --add --allowed 'mock.*key'
git secrets --add --allowed 'example.*token'
git secrets --add --allowed 'fake.*password'
git secrets --add --allowed 'placeholder.*credential'

echo ""
echo "✅ git-secrets setup complete!"
echo ""
echo "git-secrets will now scan commits for secrets."
echo "To test, try: git secrets --scan"
echo ""
echo "Note: This is in addition to the pre-commit hook checks."
echo "The pre-commit hook provides faster feedback during development."

