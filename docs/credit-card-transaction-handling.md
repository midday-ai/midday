# Credit Card Transaction Handling

This document explains how Midday handles credit card transactions from different banking providers to ensure correct categorization and amount signs.

## The Problem

Credit card transactions have unique semantics compared to regular bank accounts:

- **Purchase**: Money goes OUT (you're spending)
- **Payment to card**: Money goes IN (you're paying off balance)
- **Refund**: Money goes IN (merchant refunded you)
- **Cashback/Rewards**: Money goes IN (card benefit)

The challenge is that different providers report these transactions with different sign conventions, and **money coming IN to a credit card is NOT income** - it could be a payment, refund, or reward.

## Provider Sign Conventions

### Teller (US)

| Account Type | Transaction | Teller Reports | After Transform |
|--------------|-------------|----------------|-----------------|
| Credit | Purchase $100 | `+100` | `-100` (expense) |
| Credit | Payment $200 | `-200` | `+200` (payment) |
| Depository | Deposit $500 | `+500` | `+500` (income) |
| Depository | Withdrawal $50 | `-50` | `-50` (expense) |

**Transform**: Credit accounts have sign inverted (`amount * -1`), depository accounts use raw value.

### Plaid (US)

| Transaction | Plaid Reports | After Transform |
|-------------|---------------|-----------------|
| Money OUT | `+amount` | `-amount` |
| Money IN | `-amount` | `+amount` |

**Transform**: ALL amounts are inverted (`amount * -1`). Plaid convention is "positive = money out".

### Enable Banking (EU - PSD2)

| Transaction | API Reports | Result |
|-------------|-------------|--------|
| Money IN | `credit_debit_indicator: "CRDT"` + positive amount | Positive |
| Money OUT | `credit_debit_indicator: "DBIT"` + positive amount | Negative |

**Transform**: Uses `credit_debit_indicator` field. No account-type-specific handling needed.

### GoCardless (EU - PSD2)

| Transaction | API Reports | Result |
|-------------|-------------|--------|
| Money IN | Positive amount | Positive |
| Money OUT | Negative amount | Negative |

**Transform**: Uses signed amounts directly. No transformation needed.

## Category Logic

After amount transformation, all providers use consistent category logic:

```
if (amount > 0) {
  if (accountType === "credit") {
    // Money IN to credit card - NOT automatically income
    if (looksLikePayment(transaction)) {
      return "credit-card-payment";
    }
    // Might be refund, cashback, etc. - let user categorize
    return null;
  }
  return "income";  // Depository account
}
return null;  // Negative amounts (expenses) - let user categorize
```

### How "looksLikePayment" Works Per Provider

| Provider | Payment Indicators |
|----------|-------------------|
| **Teller** | `transaction.type` is `payment`, `bill_payment`, `digital_payment`, `ach`, or `transfer` |
| **Plaid** | `personal_finance_category.primary` is `LOAN_PAYMENTS` or `TRANSFER_IN`, or `transaction_code` is `"bill payment"` |
| **Enable Banking** | `bank_transaction_code.description` is `"Transfer"` or `"Payment"` |
| **GoCardless** | `proprietaryBankTransactionCode` is `"Transfer"` or `"Payment"` |

### Special Cases

1. **Cashback/Rewards (Teller)**: If `transaction.details.category === "income"`, categorized as `"income"`
2. **Plaid INCOME category**: If `personal_finance_category.primary === "INCOME"`, categorized as `"income"`
3. **Refunds**: Return `null` so user can manually categorize (could be miscategorized as income otherwise)

## Account Type Mapping

### Enable Banking & GoCardless (ISO 20022 Cash Account Types)

| `cashAccountType` / `cash_account_type` | Midday Type |
|----------------------------------------|-------------|
| `CARD` | `credit` |
| `LOAN` | `other_asset` |
| `CACC` (Current Account) | `depository` |
| `SVGS` (Savings) | `depository` |
| `TRAN` (Transaction) | `depository` |
| `CASH` | `depository` |
| Others | `depository` |

### Teller & Plaid

Account type is explicitly provided by the API (e.g., `credit`, `depository`).

## Test Coverage

Each provider has tests covering:

1. ✅ Depository income transaction → `"income"`
2. ✅ Depository expense transaction → `null`
3. ✅ Credit card purchase → `null` (negative amount)
4. ✅ Credit card payment → `"credit-card-payment"`
5. ✅ Credit card refund → `null` (user categorizes)
6. ✅ Account type mapping (for EU providers)

## Why This Matters

**Incorrect handling could cause:**

- Credit card payments appearing as income in reports
- Inflated income figures (every card payment counted as income)
- Incorrect profit/loss calculations
- Tax reporting issues

**The fix ensures:**

- Credit card payments are correctly categorized as `"credit-card-payment"` (a transfer, not income)
- Refunds are not auto-categorized (user decides)
- Only actual income on depository accounts is marked as `"income"`

## Files Modified

- `apps/engine/src/providers/teller/transform.ts`
- `apps/engine/src/providers/plaid/transform.ts`
- `apps/engine/src/providers/enablebanking/transform.ts`
- `apps/engine/src/providers/gocardless/transform.ts`
- Corresponding test files and snapshots

## Verification Sources

### Plaid Amount Convention (VERIFIED)

From Plaid's official API documentation and confirmed in our codebase comment:

> "Positive values when money moves out of the account; negative values when money moves in.
> For example, debit card purchases are positive; credit card payments, direct deposits, and refunds are negative."

**Source**: [Plaid Transactions API - amount field](https://plaid.com/docs/api/products/transactions/#transactions-get-response-transactions-amount)

Our implementation inverts ALL Plaid amounts, which converts their convention to: positive = money IN, negative = money OUT.

### Teller Amount Convention (VERIFIED)

From Teller's API documentation:

> "The signed amount of the transaction as a string."

For credit accounts specifically, Teller uses opposite signs:
- Positive = money OUT (purchase)
- Negative = money IN (payment)

**Source**: [Teller Transactions API](https://teller.io/docs/api/account/transactions)

Our implementation inverts ONLY credit account amounts.

### Enable Banking / GoCardless (PSD2 Standard - VERIFIED)

Both providers follow the **Berlin Group NextGenPSD2** standard which uses:

- `credit_debit_indicator`: `"CRDT"` (Credit = money IN) or `"DBIT"` (Debit = money OUT)
- `cashAccountType`: ISO 20022 account type codes (`CACC`, `CARD`, `SVGS`, etc.)

**Sources**:
- [Berlin Group NextGenPSD2 Framework](https://www.berlin-group.org/)
- [ISO 20022 External Code Sets](https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets)

### ISO 20022 Cash Account Types (VERIFIED)

| Code | Name | Description |
|------|------|-------------|
| `CACC` | Current | Account for transactional operations |
| `CARD` | CardAccount | Account for card payments |
| `CASH` | CashPayment | Cash payment account |
| `SVGS` | Savings | Savings account |
| `TRAN` | Transaction | Transaction account |
| `LOAN` | Loan | Loan account |

**Source**: [ISO 20022 External Cash Account Type Code](https://www.iso20022.org/)

## Implementation Confidence Level

| Provider | Sign Convention | Category Logic | Confidence |
|----------|----------------|----------------|------------|
| **Plaid** | ✅ Documented in code, matches Plaid docs | ✅ Uses Plaid's own categories | **HIGH** |
| **Teller** | ✅ Documented in code, verified with API | ✅ Uses transaction type field | **HIGH** |
| **Enable Banking** | ✅ Uses standard CRDT/DBIT indicator | ✅ Uses bank_transaction_code | **HIGH** |
| **GoCardless** | ✅ Uses standard signed amounts | ✅ Uses proprietaryBankTransactionCode | **HIGH** |

## References

- [Teller API Documentation](https://teller.io/docs/api/account/transactions)
- [Plaid API Documentation](https://plaid.com/docs/api/products/transactions/)
- [GoCardless Bank Account Data](https://developer.gocardless.com/bank-account-data/overview)
- [Enable Banking API](https://enablebanking.com/docs/api/reference/)
- [ISO 20022 External Code Sets](https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets)
- [Berlin Group NextGenPSD2](https://www.berlin-group.org/)
