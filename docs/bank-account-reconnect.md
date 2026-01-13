# Bank Account Reconnect Logic

## Overview

When a user reconnects a bank connection, the provider may assign new account IDs. This document describes how we safely match existing database accounts to the new API accounts and update the `account_id` field without data corruption.

## The Problem

Bank providers (GoCardless, Teller, EnableBanking) may change account IDs after a reconnect. We need to match existing database accounts to the new API accounts to maintain transaction history continuity.

**The original bug**: If multiple accounts shared the same identifier (e.g., two accounts ending in "1234"), the update query would affect multiple rows, causing both accounts to point to the same `account_id`. One account would effectively stop syncing.

## Solution: Unified Matching Algorithm

All providers use a shared `matchAndUpdateAccountIds()` function that safely matches and updates accounts.

### Matching Priority

1. **resource_id (account_reference)** - Must match exactly
2. **type** - If DB has type, must match API type
3. **currency** - If DB has currency, must match API currency
4. **name** - Tiebreaker if multiple candidates remain

### Safety Mechanisms

- Each DB account can only be matched once (tracked via `matchedDbIds` Set)
- Updates use unique DB `id`, not potentially duplicated `account_reference`
- Unmatched accounts are logged for debugging

## Provider-Specific Behavior

### GoCardless

- **resource_id**: `account.resourceId` (stable identifier)
- **Additional data**: `iban`, `bic`
- **Reconnect flow**: User re-authenticates → job triggered → accounts remapped

### Teller (US)

- **resource_id**: `last_four` (last 4 digits of account number)
- **Additional data**: `subtype` (checking, savings, credit_card, etc.)
- **Note**: `last_four` can be shared between accounts (e.g., checking and savings with same last 4 digits)

### EnableBanking (EU)

- **resource_id**: `identification_hash` (cryptographic hash, very stable)
- **Additional data**: `iban`, `bic`, `subtype`
- **Reconnect flow**: API route updates connection → triggers reconnect job

### Plaid (US)

- **resource_id**: `persistent_account_id || mask`
- **Additional data**: `subtype`
- **Note**: Plaid uses "update mode" for reconnects which preserves account IDs. No remapping needed.

## Data Fields

| Field | Description | Providers |
|-------|-------------|-----------|
| `account_reference` | Stable identifier for matching | All |
| `iban` | International Bank Account Number | GoCardless, EnableBanking |
| `bic` | Bank Identifier Code (SWIFT) | GoCardless, EnableBanking |
| `subtype` | Granular account type | Teller, Plaid, EnableBanking |

### Subtype Values

- **Teller**: `checking`, `savings`, `money_market`, `certificate_of_deposit`, `treasury`, `sweep`, `credit_card`
- **Plaid**: `checking`, `savings`, `credit_card`, `mortgage`, `student`, `auto`, etc.
- **EnableBanking**: `cacc` (current), `card`, `svgs` (savings), `loan`, `cash`

## Troubleshooting

### "No matching DB account found" Warning

This means an API account couldn't be matched to any database account. Possible causes:
1. User added a new account at the bank
2. Account was deleted from the database
3. `account_reference` changed (shouldn't happen)

### Accounts Not Syncing After Reconnect

1. Check `bank_accounts.error_retries` - may have exceeded limit
2. Verify `bank_accounts.account_id` matches the new API account ID
3. Check reconnect job logs for matching results
