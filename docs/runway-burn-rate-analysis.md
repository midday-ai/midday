# Runway & Burn Rate

## Overview

Runway calculates how many months a business can operate with current cash at current spending rate.

```
Runway (months) = Cash Balance / Average Monthly Burn Rate
```

---

## Cash Balance Calculation

Cash balance includes only liquid assets:

| Account Type | Included |
|--------------|----------|
| `depository` | ✅ Yes |
| `other_asset` | ✅ Yes |
| `credit` | ❌ No |
| `loan` | ❌ No |
| `other_liability` | ❌ No |

**Rationale:** Credit cards and loans are liabilities, not cash available to pay expenses.

---

## Burn Rate Calculation

Burn rate = sum of expenses (negative transactions) per month.

**Excluded from burn rate:**
- Transactions with `internal: true`
- Transactions with `status: 'excluded'`
- Categories with `excluded: true`:
  - `internal-transfer`
  - `credit-card-payment`

**Why credit card payments are excluded:**

When a credit card is connected, both the card transactions AND the payment from checking are synced. Counting the payment would double-count spending:

```
Credit card purchase: $5k (expense on CC account)
Payment to card: $5k (expense on checking account)
```

The actual spending is $5k, not $10k. Excluding `credit-card-payment` prevents double-counting.

---

## Period Selection

Runway varies based on selected date range because burn rate is calculated from that period:

- Shorter periods = more volatile (single expensive month skews results)
- Longer periods = more stable average

This is expected behavior — different periods reflect different spending patterns.

---

## Net Position

Net position: `Cash - Credit Debt`

**Cash includes:**
- `depository` (checking, savings)
- `other_asset` (treasury, money market)

**Debt includes:**
- `credit` (credit cards)

**Provider balance conventions:**

| Provider | Credit Debt Stored As |
|----------|----------------------|
| Plaid | Positive (e.g., `1000`) |
| GoCardless | Negative (e.g., `-1500`) |
| EnableBanking | Negative (ISO 20022) |
| Teller | Positive |

`Math.abs()` is used to normalize credit balances from all providers when calculating net position.

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/db/src/queries/reports.ts` | `getRunway()`, `getBurnRate()` |
| `packages/db/src/queries/bank-accounts.ts` | `getNetPosition()` |
| `packages/categories/src/categories.ts` | Category definitions with `excluded` flag |
