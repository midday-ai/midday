# Transaction-to-Deal Linking Design

**Date:** 2026-02-26
**Status:** Approved

## Problem

Every transaction needs to be linked to a deal ID. Currently, the `deal_code` column exists on transactions and the rules system exists for auto-categorization, but there's no way to:
- Auto-assign deals via rules
- Manually assign deals from the UI
- See which deal a transaction belongs to in the table
- Constrain rules to a date range

## Approach

Extend the existing `transaction_rules` system (Approach A) rather than building a separate mapping system or AI-based matching. This keeps a single rules system that users already understand.

## Database Changes

### Extend `transaction_rules` table

New columns:
- `set_deal_code TEXT` — explicit deal code to assign when rule fires
- `auto_resolve_deal BOOLEAN DEFAULT false` — when true, look up active deal for the matched merchant automatically
- `date_start DATE` — optional, rule only applies to transactions on or after this date
- `date_end DATE` — optional, rule only applies to transactions on or before this date

No schema changes needed on `transactions` — `deal_code` and `matched_deal_id` columns already exist.

## Rules Engine Extension

When `applyTransactionRules()` evaluates a rule:

1. Existing conditions: merchant match (contains/exact/starts_with), amount, account
2. **New condition**: if `date_start`/`date_end` are set, transaction date must fall within range
3. **New actions**:
   - If `set_deal_code` is set: write to `transactions.deal_code`
   - If `auto_resolve_deal` is true: match transaction merchant name to `merchants.name` → `mca_deals.merchant_id` → set `deal_code` and `matched_deal_id`
4. When a deal is set by a rule, also set `match_status = 'auto_matched'` and `match_rule` to the rule name

## UI Changes

### Transactions Table
- Add **"Deal" column** showing linked deal code (read-only, clickable to navigate to deal)
- Unlinked transactions show muted "Unassigned" badge with subtle indicator
- **Remove the "Assign" button** (user assignee feature)

### Transaction Detail Panel
- Add **Deal picker** — searchable dropdown of team's deals
- Selecting a deal writes `deal_code`, `matched_deal_id`, sets `match_status = 'manual_matched'`

### Rules Modal
- New action: **"Assign to deal"** with two modes:
  - **Pick a deal** — dropdown to select specific deal code
  - **Auto-resolve from merchant** — toggle, finds active deal for matched merchant
- New condition: **Date range** — optional start/end date pickers

### Attachments Section
- Collapsed by default (expandable)
- Used for non-ACH proof: cash receipts, Zelle screenshots, etc.

## Key Files

### Schema & Queries
- `supabase/migrations/` — new migration for rule columns
- `packages/db/src/schema.ts` — update transactionRules Drizzle schema
- `packages/db/src/queries/transaction-rules.ts` — extend applyTransactionRules()

### API
- `apps/api/src/trpc/routers/transaction-rules.ts` — extend create/update mutations

### UI
- `apps/dashboard/src/components/modals/transaction-rules-modal.tsx` — add deal action + date range condition
- `apps/dashboard/src/components/tables/transactions/columns.tsx` — add Deal column, remove Assign
- Transaction detail panel — add deal picker field
- Attachments section — collapse by default
