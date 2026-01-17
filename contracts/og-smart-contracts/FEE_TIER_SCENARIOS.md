# Fee Tier Scenarios

## Platform Fee Structure

**Platform Fee Components:**
- Empressa Wallet
- HM Wallet  
- NV Wallet
- Blank Wallet (Referral Fee)

**Platform Fee Application:**
- Buy Side Only
- Sell Side Only
- Split (between buy and sell sides)

## Fee Tiers

### Tier 1: 0 - $10 Million
- **Platform Fee (Default):** 1.5%
- **Platform Fee (NAPE26 Promo):** 0% (FREE)
- **Referral Fee:** 0.03% (unchanged with promo)

### Tier 2: $10 Million - $100 Million
- **Platform Fee (Default):** 1%
- **Platform Fee (NAPE26 Promo):** 0% (FREE)
- **Referral Fee:** 0.02% (unchanged with promo)

### Tier 3: $100 Million+
- **Platform Fee (Default):** 0.5%
- **Platform Fee (NAPE26 Promo):** 0% (FREE)
- **Referral Fee:** 0.01% (unchanged with promo)

---

## Scenario 1: Tier 1 Transaction (0-10M) - Default Fees

### Transaction Details
- **Sale Amount:** $5,000,000
- **Cumulative Org Revenue (before this sale):** $3,000,000
- **New Cumulative Total:** $8,000,000 (still in Tier 1)
- **Fee Tier:** Tier 1 (1.5% platform default, 0.03% referral)
- **Promo Code:** None
- **Platform Fee Application:** Split (50% buy side, 50% sell side)

### Fee Calculation
- **Platform Fee Total:** $5,000,000 × 1.5% = $75,000
  - **Buy Side Platform Fee:** $75,000 × 50% = $37,500
  - **Sell Side Platform Fee:** $75,000 × 50% = $37,500
- **Referral Fee:** $5,000,000 × 0.03% = $1,500
- **Total Fees:** $76,500

### Distribution Breakdown
**Platform Fee Split ($75,000):**
- Empressa Wallet: $75,000 × 25% = $18,750
- HM Wallet: $75,000 × 25% = $18,750
- NV Wallet: $75,000 × 25% = $18,750
- Blank Wallet (Referral): $75,000 × 25% = $18,750

**Additional Referral Fee:** $1,500 (goes to Blank Wallet)

**Blank Wallet Total:** $18,750 + $1,500 = $20,250

**Seller Receives:** $5,000,000 - $37,500 (sell side fee) = $4,962,500

**Buyer Pays:** $5,000,000 + $37,500 (buy side fee) = $5,037,500

**Seller Receives Net:** $4,962,500 - $1,500 (referral fee) = $4,961,000

---

## Scenario 2: Tier 2 Transaction (10M-100M) - Default Fees

### Transaction Details
- **Sale Amount:** $25,000,000
- **Cumulative Org Revenue (before this sale):** $12,000,000
- **New Cumulative Total:** $37,000,000 (in Tier 2)
- **Fee Tier:** Tier 2 (1% platform default, 0.02% referral)
- **Promo Code:** None
- **Platform Fee Application:** Buy Side Only

### Fee Calculation
- **Platform Fee Total:** $25,000,000 × 1% = $250,000
  - **Buy Side Platform Fee:** $250,000 (100% on buy side)
  - **Sell Side Platform Fee:** $0
- **Referral Fee:** $25,000,000 × 0.02% = $5,000
- **Total Fees:** $255,000

### Distribution Breakdown
**Platform Fee ($250,000):**
- Empressa Wallet: $250,000 × 25% = $62,500
- HM Wallet: $250,000 × 25% = $62,500
- NV Wallet: $250,000 × 25% = $62,500
- Blank Wallet (Referral): $250,000 × 25% = $62,500

**Additional Referral Fee:** $5,000 (goes to Blank Wallet)

**Blank Wallet Total:** $62,500 + $5,000 = $67,500

**Seller Receives:** $25,000,000 - $0 (no sell side fee) = $25,000,000

**Buyer Pays:** $25,000,000 + $250,000 (buy side fee) = $25,250,000

**Seller Receives Net:** $25,000,000

---

## Scenario 3: Tier 3 Transaction (100M+) - Default Fees

### Transaction Details
- **Sale Amount:** $150,000,000
- **Cumulative Org Revenue (before this sale):** $105,000,000
- **New Cumulative Total:** $255,000,000 (in Tier 3)
- **Fee Tier:** Tier 3 (0.5% platform default, 0.01% referral)
- **Promo Code:** None
- **Platform Fee Application:** Sell Side Only

### Fee Calculation
- **Platform Fee Total:** $150,000,000 × 0.5% = $750,000
  - **Buy Side Platform Fee:** $0
  - **Sell Side Platform Fee:** $750,000 (100% on sell side)
- **Referral Fee:** $150,000,000 × 0.01% = $15,000
- **Total Fees:** $765,000

### Distribution Breakdown
**Platform Fee ($750,000):**
- Empressa Wallet: $750,000 × 25% = $187,500
- HM Wallet: $750,000 × 25% = $187,500
- NV Wallet: $750,000 × 25% = $187,500
- Blank Wallet (Referral): $750,000 × 25% = $187,500

**Additional Referral Fee:** $15,000 (goes to Blank Wallet)

**Blank Wallet Total:** $187,500 + $15,000 = $202,500

**Seller Receives:** $150,000,000 - $750,000 (sell side fee) = $149,250,000

**Buyer Pays:** $150,000,000 (no buy side fee)

**Seller Receives Net:** $149,250,000 - $15,000 (referral fee) = $149,235,000

---

## Scenario 4: Tier Transition (Crossing from Tier 1 to Tier 2) - Default Fees

### Transaction Details
- **Sale Amount:** $8,500,000
- **Cumulative Org Revenue (before this sale):** $9,500,000
- **New Cumulative Total:** $18,000,000 (crosses into Tier 2)
- **Fee Tier:** Tier 2 (1% platform default, 0.02% referral) - applies to entire transaction
- **Promo Code:** None
- **Platform Fee Application:** Split (60% buy side, 40% sell side)

### Fee Calculation
- **Platform Fee Total:** $8,500,000 × 1% = $85,000
  - **Buy Side Platform Fee:** $85,000 × 60% = $51,000
  - **Sell Side Platform Fee:** $85,000 × 40% = $34,000
- **Referral Fee:** $8,500,000 × 0.02% = $1,700
- **Total Fees:** $86,700

### Distribution Breakdown
**Platform Fee ($85,000):**
- Empressa Wallet: $85,000 × 25% = $21,250
- HM Wallet: $85,000 × 25% = $21,250
- NV Wallet: $85,000 × 25% = $21,250
- Blank Wallet (Referral): $85,000 × 25% = $21,250

**Additional Referral Fee:** $1,700 (goes to Blank Wallet)

**Blank Wallet Total:** $21,250 + $1,700 = $22,950

**Seller Receives:** $8,500,000 - $34,000 (sell side fee) = $8,466,000

**Buyer Pays:** $8,500,000 + $51,000 (buy side fee) = $8,551,000

**Seller Receives Net:** $8,466,000 - $1,700 (referral fee) = $8,464,300

---

## Scenario 5: Small Transaction in Tier 1 - Default Fees

### Transaction Details
- **Sale Amount:** $500,000
- **Cumulative Org Revenue (before this sale):** $500,000
- **New Cumulative Total:** $1,000,000 (still in Tier 1)
- **Fee Tier:** Tier 1 (1.5% platform default, 0.03% referral)
- **Promo Code:** None
- **Platform Fee Application:** Split (33% buy side, 67% sell side)

### Fee Calculation
- **Platform Fee Total:** $500,000 × 1.5% = $7,500
  - **Buy Side Platform Fee:** $7,500 × 33% = $2,475
  - **Sell Side Platform Fee:** $7,500 × 67% = $5,025
- **Referral Fee:** $500,000 × 0.03% = $150
- **Total Fees:** $7,650

### Distribution Breakdown
**Platform Fee ($7,500):**
- Empressa Wallet: $7,500 × 25% = $1,875
- HM Wallet: $7,500 × 25% = $1,875
- NV Wallet: $7,500 × 25% = $1,875
- Blank Wallet (Referral): $7,500 × 25% = $1,875

**Additional Referral Fee:** $150 (goes to Blank Wallet)

**Blank Wallet Total:** $1,875 + $150 = $2,025

**Seller Receives:** $500,000 - $5,025 (sell side fee) = $494,975

**Buyer Pays:** $500,000 + $2,475 (buy side fee) = $502,475

**Seller Receives Net:** $494,975 - $150 (referral fee) = $494,825

---

## Key Implementation Notes

1. **Cumulative Revenue Tracking:** The tier is determined by the cumulative revenue of the organization contract BEFORE adding the current transaction amount.

2. **Platform Fee Split:** The platform fee can be applied:
   - 100% buy side (buyer pays extra)
   - 100% sell side (seller receives less)
   - Split (e.g., 50/50, 60/40, etc.)

3. **Platform Fee Distribution:** The total platform fee is split equally (25% each) among:
   - Empressa Wallet
   - HM Wallet
   - NV Wallet
   - Blank Wallet (as part of platform fee)

4. **Referral Fee:** In addition to the platform fee, a separate referral fee is calculated and added to the Blank Wallet.

5. **Seller Net Amount:** Seller receives: Sale Amount - Sell Side Platform Fee - Referral Fee

6. **Buyer Total Cost:** Buyer pays: Sale Amount + Buy Side Platform Fee

---

## Promo Code Scenarios

**NAPE26 Promo Code:** Makes platform fees FREE (0%) for all tiers. Referral fees remain unchanged.

---

## Scenario 6: Tier 1 Transaction WITH NAPE26 Promo Code

### Transaction Details
- **Sale Amount:** $5,000,000
- **Cumulative Org Revenue (before this sale):** $3,000,000
- **New Cumulative Total:** $8,000,000 (still in Tier 1)
- **Fee Tier:** Tier 1
- **Promo Code:** "NAPE26" (active, valid)
- **Platform Fee:** 0% (FREE with NAPE26 promo code)
- **Referral Fee:** 0.03% (unchanged)
- **Platform Fee Application:** Split (50% buy side, 50% sell side)

### Fee Calculation
- **Platform Fee Total:** $5,000,000 × 0% = $0
  - **Buy Side Platform Fee:** $0
  - **Sell Side Platform Fee:** $0
- **Referral Fee:** $5,000,000 × 0.03% = $1,500
- **Total Fees:** $1,500

### Distribution Breakdown
**Platform Fee Split ($0):**
- Empressa Wallet: $0
- HM Wallet: $0
- NV Wallet: $0
- Blank Wallet (Referral): $0

**Additional Referral Fee:** $1,500 (goes to Blank Wallet)

**Blank Wallet Total:** $0 + $1,500 = $1,500

**Seller Receives:** $5,000,000 - $0 (sell side fee) = $5,000,000

**Buyer Pays:** $5,000,000 + $0 (buy side fee) = $5,000,000

**Seller Receives Net:** $5,000,000 - $1,500 (referral fee) = $4,998,500

**Savings vs. Default:** $75,000 (platform fee saved)

---

## Scenario 7: Tier 2 Transaction WITH NAPE26 Promo Code

### Transaction Details
- **Sale Amount:** $25,000,000
- **Cumulative Org Revenue (before this sale):** $12,000,000
- **New Cumulative Total:** $37,000,000 (in Tier 2)
- **Fee Tier:** Tier 2
- **Promo Code:** "NAPE26" (active, valid)
- **Platform Fee:** 0% (FREE with NAPE26 promo code)
- **Referral Fee:** 0.02% (unchanged)
- **Platform Fee Application:** Buy Side Only

### Fee Calculation
- **Platform Fee Total:** $25,000,000 × 0% = $0
  - **Buy Side Platform Fee:** $0
  - **Sell Side Platform Fee:** $0
- **Referral Fee:** $25,000,000 × 0.02% = $5,000
- **Total Fees:** $5,000

### Distribution Breakdown
**Platform Fee ($0):**
- Empressa Wallet: $0
- HM Wallet: $0
- NV Wallet: $0
- Blank Wallet (Referral): $0

**Additional Referral Fee:** $5,000 (goes to Blank Wallet)

**Blank Wallet Total:** $0 + $5,000 = $5,000

**Seller Receives:** $25,000,000 - $0 (no sell side fee) = $25,000,000

**Buyer Pays:** $25,000,000 + $0 (buy side fee) = $25,000,000

**Seller Receives Net:** $25,000,000

**Savings vs. Default:** $250,000 (platform fee saved)

---

## Scenario 8: Tier 3 Transaction WITH NAPE26 Promo Code

### Transaction Details
- **Sale Amount:** $150,000,000
- **Cumulative Org Revenue (before this sale):** $105,000,000
- **New Cumulative Total:** $255,000,000 (in Tier 3)
- **Fee Tier:** Tier 3
- **Promo Code:** "NAPE26" (active, valid)
- **Platform Fee:** 0% (FREE with NAPE26 promo code)
- **Referral Fee:** 0.01% (unchanged)
- **Platform Fee Application:** Sell Side Only

### Fee Calculation
- **Platform Fee Total:** $150,000,000 × 0% = $0
  - **Buy Side Platform Fee:** $0
  - **Sell Side Platform Fee:** $0
- **Referral Fee:** $150,000,000 × 0.01% = $15,000
- **Total Fees:** $15,000

### Distribution Breakdown
**Platform Fee ($0):**
- Empressa Wallet: $0
- HM Wallet: $0
- NV Wallet: $0
- Blank Wallet (Referral): $0

**Additional Referral Fee:** $15,000 (goes to Blank Wallet)

**Blank Wallet Total:** $0 + $15,000 = $15,000

**Seller Receives:** $150,000,000 - $0 (sell side fee) = $150,000,000

**Buyer Pays:** $150,000,000 (no buy side fee)

**Seller Receives Net:** $150,000,000 - $15,000 (referral fee) = $149,985,000

**Savings vs. Default:** $750,000 (platform fee saved)

---

## Scenario 9: NAPE26 Promo Code Comparison - Tier 1

### Default Fees (No Promo Code)
- **Sale Amount:** $2,000,000
- **Platform Fee:** 1.5% = $30,000
- **Referral Fee:** 0.03% = $600
- **Total Fees:** $30,600

### With NAPE26 Promo Code
- **Sale Amount:** $2,000,000
- **Platform Fee:** 0% = $0 (FREE)
- **Referral Fee:** 0.03% = $600 (unchanged)
- **Total Fees:** $600
- **Savings:** $30,000 (100% reduction on platform fee)

---

## Promo Code Implementation Notes

1. **NAPE26 Promo Code:**
   - Makes platform fees FREE (0%) for ALL tiers
   - Tier 1: 1.5% → 0%
   - Tier 2: 1% → 0%
   - Tier 3: 0.5% → 0%

2. **Promo Code Validation:**
   - Must be active/enabled
   - Must not be expired
   - Must have remaining uses (if usage-limited)
   - Must be valid for the organization/transaction type
   - Case-sensitive: "NAPE26" must match exactly

3. **Referral Fees:**
   - Referral fees are NOT affected by promo codes
   - They remain at 0.03%, 0.02%, and 0.01% respectively even with NAPE26

4. **Platform Fee Distribution (with NAPE26):**
   - When platform fee is 0%, no distribution occurs
   - Only referral fee is collected and sent to Blank Wallet

5. **Promo Code Tracking:**
   - Track promo code usage per transaction
   - Track total savings per promo code
   - Enforce usage limits if applicable
   - Track which transactions used NAPE26 for reporting
