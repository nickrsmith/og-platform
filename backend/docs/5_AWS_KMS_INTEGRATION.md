# AWS KMS Integration - Complete Guide

## Overview

This document covers the AWS KMS integration for wallet encryption. The system uses AWS KMS for distributed, secure key management with automatic rotation capabilities.

**Current Status:** ✅ Fully Implemented and Working

## Quick Start

### Start the KMS Service
```bash
./scripts/start-kms-service.sh
```

### Test the Implementation
```bash
./scripts/test-kms.sh
```

### Create KMS Aliases (one-time setup)
```bash
node scripts/create-kms-aliases.mjs
```

### Key Files
- **Services**: `apps/kms-service/src/aws-kms/aws-kms.service.ts`, `apps/kms-service/src/wallets/wallets-kms.service.ts`
- **Scripts**: `scripts/start-kms-service.sh`, `scripts/create-kms-aliases.mjs`, `scripts/test-kms.sh`, `scripts/get-db-url.sh`
- **Migration**: `libs/database/prisma/migrations/20251029000000_add_kms_fields/migration.sql`

### AWS KMS Implementation
- **Multiple KMS Keys**: 10 AWS KMS Customer Managed Keys (CMKs)
- **Distributed Risk**: Each wallet uses a randomly selected KMS key
- **Automatic Rotation**: AWS KMS handles key rotation automatically
- **Enhanced Security**: Keys never leave AWS KMS, reducing attack surface
- **Production Ready**: Fully implemented and tested in production

## Architecture Design

### 1. KMS Key Pool Management
```typescript
interface KmsKeyPool {
  keys: KmsKeyInfo[];
  currentActiveKeys: string[];
  rotationSchedule: RotationConfig;
}

interface KmsKeyInfo {
  keyId: string;
  alias: string;
  region: string;
  status: 'Active' | 'PendingDeletion' | 'Disabled';
  creationDate: Date;
  lastUsedDate?: Date;
}
```

### 2. Wallet Encryption Flow
**Location:** `WalletsKmsService.createWallet()`

1. **Generate Wallet**: Create new Ethereum wallet with ethers.js
   ```typescript
   const wallet = Wallet.createRandom();
   const mnemonic = wallet.mnemonic.phrase;
   ```

2. **Generate DEK**: Create random 32-byte Data Encryption Key
   ```typescript
   const dek = randomBytes(32); // 256-bit random key
   ```

3. **Select KMS Key**: Randomly choose from active KMS key pool
   ```typescript
   const selectedKeyId = this.selectRandomKey();
   ```

4. **Encrypt DEK with AWS KMS**: Use AWS KMS to encrypt DEK with selected CMK
   ```typescript
   const encrypted = await kmsClient.encrypt(dek, selectedKeyId);
   ```

5. **Encrypt Mnemonic**: Encrypt wallet mnemonic with DEK (AES-256-GCM)
   ```typescript
   const encryptedSeed = this._encrypt(mnemonic, dek);
   ```

6. **Store Data**: Save encrypted mnemonic, encrypted DEK, and KMS key reference
   ```typescript
   await prisma.wallet.create({
     data: {
       userId,
       walletAddress: wallet.address,
       encryptedSeed,    // Mnemonic encrypted with DEK
       encryptedDek,     // DEK encrypted with KMS
       kmsKeyId,         // Which KMS key was used
       kmsRegion,        // AWS region
     }
   });
   ```

### 3. Wallet Decryption Flow
**Location:** `WalletsKmsService.getPrivateKeyForUser()`

1. **Retrieve Data**: Get encrypted mnemonic, encrypted DEK, and KMS key ID from DB
   ```typescript
   const walletRecord = await prisma.wallet.findUnique({ where: { userId } });
   ```

2. **Decrypt DEK using AWS KMS**: Use AWS KMS to decrypt DEK with specified CMK
   ```typescript
   const dek = await awsKmsService.decryptDek(encryptedDekBlob, kmsKeyId);
   ```

3. **Decrypt Mnemonic**: Decrypt wallet mnemonic with DEK
   ```typescript
   const mnemonic = this._decrypt(walletRecord.encryptedSeed, dek);
   ```

4. **Return Private Key**: Reconstruct wallet and return private key
   ```typescript
   const wallet = Wallet.fromPhrase(mnemonic);
   return wallet.privateKey;
   ```

## Database Schema Changes

### Updated Wallet Table
```sql
ALTER TABLE wallets ADD COLUMN kms_key_id VARCHAR(255);
ALTER TABLE wallets ADD COLUMN kms_region VARCHAR(50);
```

**Migration File**: `libs/database/prisma/migrations/20251029000000_add_kms_fields/migration.sql`

### Migration Strategy
The system uses AWS KMS exclusively for all wallet encryption. No legacy encryption support is needed.

## Key Rotation Strategy

### Automatic Rotation
- AWS KMS CMKs rotate automatically every 12 months
- Old key versions remain available for decryption
- New encryptions use the latest key version

### Manual Rotation
- Add new KMS keys to the pool
- Gradually migrate wallets to new keys
- Deprecate old keys after migration period

## Security Benefits

1. **Distributed Risk**: Compromise of one KMS key affects only subset of wallets
2. **Hardware Security**: Keys stored in AWS CloudHSM
3. **Audit Trail**: All key usage logged in CloudTrail
4. **Access Control**: Fine-grained IAM policies for key access
5. **Compliance**: Meets various compliance requirements (SOC, PCI, etc.)

## AWS KMS Integration

The service uses AWS Key Management Service (KMS) as the primary encryption method for all wallets.

### Behavior
- **AWS KMS is always enabled** - no configuration flag needed
- **10 KMS keys** are configured and actively used
- **Random key selection** distributes risk across the key pool
- **Production ready** and tested

### Configuration
- AWS credentials are **required** at startup
- Provide AWS credentials and KMS configuration in `.env`
- **Clear error messages** guide proper setup if credentials are missing

## Implementation Plan

### Phase 1: Infrastructure Setup
- [x] Create AWS KMS keys and aliases
- [x] Set up IAM roles and policies
- [x] Configure AWS SDK in kms-service
- [x] Add KMS configuration to environment
- [x] Implement graceful configuration handling

### Phase 2: Service Implementation
- [x] Create AwsKmsService for AWS KMS operations
- [x] Implement key pool management
- [x] Update WalletsKmsService for KMS-only encryption
- [x] Configure AWS credentials handling

### Phase 3: Database Schema
- [x] Add KMS key reference columns to wallet table
- [x] Remove legacy encryption fields
- [x] Update Prisma schema

### Phase 4: Testing & Deployment
- [x] Unit tests for KMS operations
- [x] Integration tests for wallet operations
- [x] Performance testing
- [x] Staging environment validation
- [x] Production deployment

## Configuration

### Environment Variables
```bash
# AWS Configuration (REQUIRED)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# KMS Configuration (REQUIRED)
KMS_KEY_POOL_SIZE=10
KMS_KEY_ALIAS_PREFIX=Empressa-wallet-key
```

### IAM Policy Example
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/*"
    }
  ]
}
```

## Monitoring & Alerting

### CloudWatch Metrics
- KMS key usage frequency
- Encryption/decryption latency
- Error rates and types
- Key rotation events

### Alerts
- Unusual key usage patterns
- High error rates
- Failed decryption attempts
- Key access denied events

## Cost Considerations

### AWS KMS Pricing
- $1.00 per CMK per month
- $0.03 per 10,000 requests
- Estimated cost: ~$10/month for 10 keys + usage

### Optimization Strategies
- Key pooling to reduce CMK count
- Request batching where possible
- Monitoring usage patterns
- Regular cost reviews

## Operational Procedures

### Service Restart
1. Service will automatically reconnect to AWS KMS on startup
2. Key pool will be reinitialized from configured AWS keys
3. All existing wallets remain accessible

### Key Rotation
- AWS KMS automatically rotates keys on a yearly schedule
- No manual intervention required
- Automatic rotation does not affect existing encrypted data

## Current Implementation Status

### ✅ Production Ready
- **Service**: Fully implemented and running
- **KMS Keys**: 10 keys configured and active in AWS
- **AWS Configuration**: Required credentials in `.env`
- **Testing**: All tests passing
- **Port**: Service running on 3001

---

**This document contains all information about the AWS KMS integration including architecture, flows, configuration, and operational procedures.**
