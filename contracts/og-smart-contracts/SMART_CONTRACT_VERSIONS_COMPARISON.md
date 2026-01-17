# Smart Contract Versions Comparison: Vanilla vs Obfuscated

## Overview

The smart contracts repository contains two versions of each contract:
- **Vanilla**: Readable, human-friendly variable and function names (for development)
- **Obfuscated**: Obfuscated variable and function names (for production deployment)

## Key Differences

### 1. Variable Name Obfuscation

**Vanilla Version:**
- Uses descriptive, readable names
- Example: `DISTRIBUTOR_ADMIN_ROLE`, `factory`, `usdcToken`, `distributeRevenue()`

**Obfuscated Version:**
- Uses cryptic, obfuscated names
- Example: `_cbfeac8`, `_v7b202d`, `_v0fa623`, `_f216d88()`
- Same functionality, but harder to read/reverse engineer

### 2. Function Name Obfuscation

**Vanilla Examples:**
```solidity
function distributeRevenue(...) external onlyAuthorized
function setCustomFees(...) external onlyRole(DISTRIBUTOR_ADMIN_ROLE)
function withdrawAllOrgEarnings(...) external nonReentrant
function getOrgEarnings(...) external view returns (...)
```

**Obfuscated Examples:**
```solidity
function _f216d88(...) external _m5b7b5c nonReentrant
function _f7430d9(...) external onlyRole(_cbfeac8)
function _f7a8b9c(...) external nonReentrant
function _f9e8b2a(...) external view returns (...)
```

### 3. Event Name Obfuscation

**Vanilla:**
```solidity
event RevenueDistributed(...)
event CustomFeesSet(...)
event EarningsWithdrawn(...)
```

**Obfuscated:**
```solidity
event _eefb66c(...)
event _ee5edb3(...)
event EarningsWithdrawn(...) // Some events remain readable
```

### 4. Modifier Name Obfuscation

**Vanilla:**
```solidity
modifier onlyAuthorized() {
    require(hasRole(AUTHORIZED_CONTRACT_ROLE, msg.sender), "Caller not authorized");
    _;
}
```

**Obfuscated:**
```solidity
modifier _m5b7b5c() {
    require(hasRole(_c15d343, msg.sender), "Caller not authorized");
    _;
}
```

### 5. Role Constant Obfuscation

**Vanilla:**
```solidity
bytes32 public constant DISTRIBUTOR_ADMIN_ROLE = keccak256("DISTRIBUTOR_ADMIN_ROLE");
bytes32 public constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");
bytes32 public constant PRINCIPAL_ROLE = keccak256("PRINCIPAL_ROLE");
```

**Obfuscated:**
```solidity
bytes32 public constant _cbfeac8 = keccak256("_cbfeac8");
bytes32 public constant _c15d343 = keccak256("_c15d343");
bytes32 public constant _c1522a0 = keccak256("_c1522a0");
```

### 6. State Variable Obfuscation

**Vanilla:**
```solidity
address public immutable factory;
address public immutable usdcToken;
mapping(address => uint256) public pendingCreatorEarnings;
```

**Obfuscated:**
```solidity
address public immutable _v7b202d;
address public immutable _v0fa623;
mapping(address => uint256) public pendingCreatorEarnings; // Some public mappings remain readable
```

## What Stays the Same

### 1. Contract Logic
- **Identical functionality** - Both versions execute the same business logic
- Same calculations, same security checks, same access controls

### 2. Public Mappings
- Many public mappings keep readable names (e.g., `pendingCreatorEarnings`, `totalCreatorEarnings`)
- This is likely because they're accessed externally and need to be discoverable

### 3. Error Messages
- Some error messages remain readable (e.g., "Caller not authorized", "Amount must be greater than 0")
- Some are partially obfuscated (e.g., "Invalid _v7b202d" instead of "Invalid factory")

### 4. Event Parameters
- Some event parameters keep readable names (e.g., `EmpressaAmount`, `integratorAmount`)
- Event names themselves are often obfuscated

### 5. Interface Compliance
- Both versions must implement the same interfaces
- External function signatures that match interfaces may remain readable

## Detailed Comparison: EmpressaRevenueDistributor

### Function Mapping

| Vanilla Function | Obfuscated Function | Purpose |
|-----------------|-------------------|---------|
| `distributeRevenue()` | `_f216d88()` | Distribute revenue from transactions |
| `setCustomFees()` | `_f7430d9()` | Set custom fee percentages |
| `removeCustomFees()` | `_fc19fc5()` | Remove custom fees |
| `addAuthorizedContract()` | `_f484414()` | Add authorized contract |
| `removeAuthorizedContract()` | `_f6baf4e()` | Remove authorized contract |
| `getOrgEarnings()` | `_f9e8b2a()` | Get organization earnings breakdown |
| `getOrgPendingTotal()` | `_f8c7d3e()` | Get total pending earnings |
| `getOrgDistributedTotal()` | `_f9d4e2a()` | Get total distributed earnings |
| `withdrawAllOrgEarnings()` | `_f7a8b9c()` | Withdraw all organization earnings |
| `getRevenueStats()` | `_fdd13e2()` | Get revenue statistics |
| `getCustomFees()` | `_f434c53()` | Get custom fee structure |
| `_getFees()` | `_f2d56cb()` | Internal: Get fee percentages |
| `_getOrgPendingEarnings()` | `_f8c7d3f()` | Internal: Get pending earnings |
| `_getOrgDistributedEarnings()` | `_f9d4e2b()` | Internal: Get distributed earnings |

### Variable Mapping

| Vanilla Variable | Obfuscated Variable | Type | Purpose |
|----------------|-------------------|------|---------|
| `DISTRIBUTOR_ADMIN_ROLE` | `_cbfeac8` | bytes32 | Admin role constant |
| `AUTHORIZED_CONTRACT_ROLE` | `_c15d343` | bytes32 | Authorized contract role |
| `PRINCIPAL_ROLE` | `_c1522a0` | bytes32 | Principal role constant |
| `factory` | `_v7b202d` | address | Factory contract address |
| `usdcToken` | `_v0fa623` | address | USDC token address |
| `orgContract` | `_v3030a8` | address | Organization contract (parameter) |
| `assetId` | `_v9d8e96` | uint256 | Asset ID (parameter) |
| `amount` | `_v9cb6ff` | uint256 | Amount (parameter) |
| `ownerAmount` | `_vcf4b0b` | uint256 | Owner/creator amount |
| `EmpressaFee` | `_vf0d665` | uint256 | Empressa platform fee |
| `integratorFee` | `_v9aa481` | uint256 | Integrator fee |
| `EmpressaFeePct` | `_v3d6202` | uint32 | Empressa fee percentage |
| `integratorFeePct` | `_v3055c2` | uint32 | Integrator fee percentage |

## Detailed Comparison: EmpressaOrgContract

### Function Mapping

| Vanilla Function | Obfuscated Function | Purpose |
|-----------------|-------------------|---------|
| `setLicenseManager()` | `_fbb393f()` | Set license manager address |
| `setAssetRegistry()` | `_f56a5d5()` | Set asset registry address |
| `setGroupManager()` | `_feb75e6()` | Set group manager address |
| `setRevenueDistributor()` | `_f666724()` | Set revenue distributor address |
| `addCreator()` | `_f3fc77c()` | Add creator to organization |
| `removeCreator()` | `_f8a9b2c()` | Remove creator from organization |
| `getCreators()` | `_f8a9b2c()` | Get list of creators |
| `getIntegrator()` | `_fbd9641()` | Get integrator address |

### Variable Mapping

| Vanilla Variable | Obfuscated Variable | Type | Purpose |
|----------------|-------------------|------|---------|
| `PRINCIPAL_ROLE` | `_c1522a0` | bytes32 | Principal role constant |
| `CREATOR_ROLE` | `_c887dee` | bytes32 | Creator role constant |
| `VERIFIER_ROLE` | `_cca4bd5` | bytes32 | Verifier role constant |
| `factory` | `_v7b202d` | address | Factory contract address |
| `principal` | `_v35a34c` | address | Principal user address |
| `integrationPartner` | `_vbd9641` | address | Integration partner address |
| `licenseManager` | `_vd0b565` | address | License manager module |
| `assetRegistry` | `_v9b2fda` | address | Asset registry module |
| `groupManager` | `_v45f631` | address | Group manager module |
| `revenueDistributor` | `_vedea5b` | address | Revenue distributor module |
| `creators` | `_v1f9442` | address[] | Array of creator addresses |

## Why Obfuscation?

### Benefits:
1. **Security Through Obscurity**: Makes reverse engineering harder
2. **Protect Business Logic**: Hides fee structures and business rules
3. **Competitive Advantage**: Makes it harder for competitors to copy
4. **Production Deployment**: Recommended for mainnet deployments

### Drawbacks:
1. **Harder to Audit**: Security audits are more difficult
2. **Maintenance Challenges**: Harder to maintain and debug
3. **Developer Experience**: Much harder for developers to work with
4. **Transparency**: Reduces transparency for users/auditors

## Development Strategy

### Recommended Approach:
1. **Develop in Vanilla**: Make all changes to vanilla contracts first
2. **Test Thoroughly**: Test vanilla contracts extensively
3. **Obfuscate After**: Generate obfuscated version after vanilla is stable
4. **Deploy Obfuscated**: Use obfuscated version for production
5. **Keep Both**: Maintain both versions in repository

### For Our Monetization Changes:
- **Make changes to vanilla contracts** (`contracts/og-smart-contracts/contracts/`)
- **Test vanilla contracts** thoroughly
- **Generate obfuscated version** after changes are finalized
- **Update both versions** to keep them in sync

## Obfuscation Pattern Analysis

### Naming Convention:
- **Constants**: `_c` prefix + hex string (e.g., `_cbfeac8`)
- **Variables**: `_v` prefix + hex string (e.g., `_v7b202d`)
- **Functions**: `_f` prefix + hex string (e.g., `_f216d88`)
- **Modifiers**: `_m` prefix + hex string (e.g., `_m5b7b5c`)
- **Events**: `_e` prefix + hex string (e.g., `_eefb66c`)

### What Gets Obfuscated:
- ✅ Internal/private functions
- ✅ Internal state variables
- ✅ Role constants
- ✅ Modifier names
- ✅ Event names (sometimes)
- ✅ Function parameters (sometimes)

### What Stays Readable:
- ✅ Public mappings (for external access)
- ✅ Some event parameters
- ✅ Some error messages
- ✅ Interface function signatures (if required)

## Impact on Our Changes

### When Making Monetization Changes:

1. **Work with Vanilla First**
   - All new functions should have readable names
   - All new variables should be descriptive
   - Easier to review and test

2. **Consider Obfuscation Later**
   - After vanilla is tested and approved
   - Use same obfuscation tool/process as original
   - Ensure both versions have identical functionality

3. **Maintain Compatibility**
   - Both versions must implement same interfaces
   - External function signatures should match
   - Event structures should be identical

4. **Documentation**
   - Document changes in vanilla version
   - Create mapping between vanilla and obfuscated
   - Update this comparison document

## Questions to Consider

1. **Do we need to obfuscate our new changes?**
   - If deploying to production: Yes
   - If only for development: No

2. **How do we generate obfuscated version?**
   - Need to find/use the obfuscation tool used by Empressa
   - Or manually obfuscate following the same pattern

3. **Should we maintain both versions?**
   - Yes, for production deployments
   - Vanilla for development, obfuscated for production

4. **What about existing deployments?**
   - Need to check if deployed contracts are vanilla or obfuscated
   - New changes must be compatible with existing deployments

---

**Next Steps:**
1. Review this comparison
2. Decide on development approach (vanilla first, then obfuscate)
3. Plan monetization changes for vanilla contracts
4. Determine obfuscation strategy for new changes
