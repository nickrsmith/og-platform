# Hauska → Empressa Migration: Potential Issues & Resolutions

## ✅ Fixed Issues

### 1. ABI File Names Mismatch - **FIXED**
**Problem**: Code was importing `Empressa*.json` but files were named `Hauska*.json`  
**Impact**: Import errors, runtime failures  
**Resolution**: Renamed all ABI JSON files to match new naming:
- `HauskaContractFactoryUpgradeable.json` → `EmpressaContractFactoryUpgradeable.json`
- `HauskaOrgContract.json` → `EmpressaOrgContract.json`
- `HauskaAssetRegistry.json` → `EmpressaAssetRegistry.json`
- `HauskaLicenseManagerV2.json` → `EmpressaLicenseManagerV2.json`
- `HauskaRevenueDistributor.json` → `EmpressaRevenueDistributor.json`

## ⚠️ Potential Issues Requiring Attention

### 2. RabbitMQ Topic Name Change
**Changed**: `hauska.events.topic` → `empressa.events.topic`

**Potential Impact**:
- Existing queues listening to the old topic won't receive messages
- If RabbitMQ exchange isn't recreated with new name, messages will be lost
- Services publishing to old topic won't be received

**Resolution Required**:
1. **If RabbitMQ is running**: Update/create exchange with new name or keep both topics during migration
2. **For Development**: Restart RabbitMQ or update docker-compose to use new topic name
3. **For Production**: Coordinate downtime or run both topics in parallel during migration

**Location**: 
- `backend/apps/core-api/src/core-api.module.ts` (line 115)
- `backend/apps/core-api/src/processors/reconciliation.processor.ts` (line 52)

### 3. AWS KMS Key Aliases
**Changed**: `alias/hauska-wallet-key-*` → `alias/empressa-wallet-key-*`

**Potential Impact**:
- KMS service won't find keys if aliases don't exist with new names
- Wallet creation/retrieval will fail
- Existing wallets may become inaccessible if code looks for new aliases

**Resolution Required**:
1. **Option A (Recommended)**: Keep old aliases active, create new aliases pointing to same keys
   ```bash
   # Create new aliases pointing to existing keys
   aws kms create-alias --alias-name alias/empressa-wallet-key-1 --target-key-id <existing-key-id>
   ```
2. **Option B**: Update AWS KMS aliases to match new naming before deployment
3. **Option C**: Update code to look for old aliases if migration isn't ready

**Location**:
- `backend/scripts/create-kms-aliases.mjs` (line 59)
- `backend/ENVIRONMENT_SETUP.md` (line 158)

### 4. Contract Source File Paths in sync-abis.mjs
**Changed**: Path references updated to `Empressa-smart-contracts-demo/vanilla/artifacts`

**Potential Impact**:
- Script will fail if contract source repository hasn't been renamed
- ABI synchronization won't work

**Resolution Required**:
1. Rename the contracts repository directory OR
2. Update the path in `sync-abis.mjs` to match actual directory name OR
3. Create a symlink from old name to new name

**Location**: `backend/scripts/sync-abis.mjs` (line 46)

### 5. Deployed Smart Contracts (On-Chain)
**Note**: This is **NOT a problem** - Contract names in code are just for ABI selection

**Why it's safe**:
- The code uses contract **addresses** (stored in database) to interact with contracts
- Contract names like "EmpressaOrgContract" are only used to select which ABI to use
- As long as the ABI matches the deployed contract interface, it works regardless of the contract's actual on-chain name
- The deployed contracts themselves don't need to be redeployed

**No action required** ✅

## 🔍 Verification Steps

### Before Deployment:

1. **Check RabbitMQ Exchange**:
   ```bash
   # Verify exchange exists or will be auto-created
   curl -u guest:guest http://localhost:15672/api/exchanges | grep empressa
   ```

2. **Verify KMS Aliases**:
   ```bash
   aws kms list-aliases | grep empressa-wallet-key
   ```

3. **Test ABI Imports**:
   ```bash
   cd backend
   npm run build
   # Should not have import errors
   ```

4. **Verify Contract Source Path**:
   ```bash
   ls -la ../Empressa-smart-contracts-demo/vanilla/artifacts
   # Or check if path needs updating
   ```

## 📋 Summary

**Critical Issues** (Must fix before deployment):
1. ✅ ABI file names - **FIXED**
2. ⚠️ RabbitMQ topic - **Needs verification/config update**
3. ⚠️ KMS aliases - **Needs AWS configuration**

**Non-Critical** (Will work but should verify):
4. Contract source path in sync-abis.mjs - **Only affects ABI sync script**

**Not an Issue**:
5. On-chain contract names - **Works regardless of naming**

## Recommended Migration Order

1. ✅ **Done**: Rename ABI files (completed)
2. **Next**: Update/create RabbitMQ exchange for new topic
3. **Then**: Create/update KMS aliases in AWS
4. **Finally**: Update contract source repository path if needed

---

*Generated: January 16, 2026*
