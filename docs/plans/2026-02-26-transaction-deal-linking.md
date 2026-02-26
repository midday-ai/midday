# Transaction-to-Deal Linking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable automatic and manual linking of transactions to MCA deals via extended rules and UI.

**Architecture:** Extend the existing `transaction_rules` table with deal-assignment actions and date-range conditions. Add a Deal column to the transactions table, a deal picker to the transaction detail panel, and collapse attachments by default. Remove the Assign column.

**Tech Stack:** Drizzle ORM, PostgreSQL migration, tRPC, React (TanStack Query), Radix UI components

---

### Task 1: Database Migration — Add deal & date columns to transaction_rules

**Files:**
- Create: `supabase/migrations/20260226000000_add_deal_and_date_to_transaction_rules.sql`
- Modify: `packages/db/src/schema.ts:4285-4320` (transactionRules table)

**Step 1: Create the migration file**

```sql
-- Add deal assignment actions and date range conditions to transaction_rules
ALTER TABLE public.transaction_rules
  ADD COLUMN IF NOT EXISTS set_deal_code TEXT,
  ADD COLUMN IF NOT EXISTS auto_resolve_deal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_start DATE,
  ADD COLUMN IF NOT EXISTS date_end DATE;

-- Comment for clarity
COMMENT ON COLUMN public.transaction_rules.set_deal_code IS 'Explicit deal code to assign when rule fires';
COMMENT ON COLUMN public.transaction_rules.auto_resolve_deal IS 'When true, auto-resolve deal from merchant name lookup';
COMMENT ON COLUMN public.transaction_rules.date_start IS 'Rule only applies to transactions on or after this date';
COMMENT ON COLUMN public.transaction_rules.date_end IS 'Rule only applies to transactions on or before this date';
```

**Step 2: Update the Drizzle schema**

In `packages/db/src/schema.ts`, add after the existing `setAssignedId` field (around line 4310):

```typescript
    // Deal assignment actions
    setDealCode: text("set_deal_code"),
    autoResolveDeal: boolean("auto_resolve_deal").notNull().default(false),

    // Date range criteria
    dateStart: date("date_start"),
    dateEnd: date("date_end"),
```

**Step 3: Push migration to local Supabase**

Run: `supabase db push` (or apply via Supabase MCP)
Expected: Migration applies cleanly, 4 new columns on transaction_rules

**Step 4: Commit**

```bash
git add supabase/migrations/20260226000000_add_deal_and_date_to_transaction_rules.sql packages/db/src/schema.ts
git commit -m "feat: add deal assignment and date range columns to transaction_rules"
```

---

### Task 2: Extend rules engine — deal assignment + date filtering

**Files:**
- Modify: `packages/db/src/queries/transaction-rules.ts:5-36` (CreateRuleParams type)
- Modify: `packages/db/src/queries/transaction-rules.ts:38-64` (createTransactionRule)
- Modify: `packages/db/src/queries/transaction-rules.ts:66-100` (updateTransactionRule types + function)
- Modify: `packages/db/src/queries/transaction-rules.ts:129-211` (applyTransactionRules)
- Modify: `packages/db/src/queries/transaction-rules.ts:213-273` (matchesRule)

**Step 1: Add new fields to CreateRuleParams and UpdateRuleParams**

Add to `CreateRuleParams` (after `setAssignedId`):
```typescript
  setDealCode?: string | null;
  autoResolveDeal?: boolean;
  dateStart?: string | null;
  dateEnd?: string | null;
```

Add same fields to `UpdateRuleParams`.

**Step 2: Pass new fields in createTransactionRule and updateTransactionRule**

In `createTransactionRule`, add to the `.values({})` block:
```typescript
      setDealCode: params.setDealCode,
      autoResolveDeal: params.autoResolveDeal ?? false,
      dateStart: params.dateStart,
      dateEnd: params.dateEnd,
```

The `updateTransactionRule` already spreads `...updates` so it will pick up new fields automatically.

**Step 3: Add date to the fetched transaction fields in applyTransactionRules**

In `applyTransactionRules`, update the transaction select (line ~151) to also fetch `date`:
```typescript
      date: transactions.date,
```

**Step 4: Extend matchesRule to check date range**

Add `date` to the `txn` parameter type:
```typescript
function matchesRule(
  txn: {
    name: string;
    merchantName: string | null;
    amount: number;
    bankAccountId: string | null;
    date: string;
  },
  rule: typeof transactionRules.$inferSelect,
): boolean {
```

At the end of `matchesRule`, before `return true`, add:
```typescript
  // Check date range
  if (rule.dateStart && txn.date < rule.dateStart) {
    return false;
  }
  if (rule.dateEnd && txn.date > rule.dateEnd) {
    return false;
  }
```

**Step 5: Add deal assignment to the action block in applyTransactionRules**

After the `setAssignedId` check (around line 185), add:
```typescript
      if (rule.setDealCode) {
        updates.dealCode = rule.setDealCode;
        updates.matchStatus = "auto_matched";
        updates.matchRule = rule.name;
        updates.matchedAt = new Date().toISOString();
      }

      if (rule.autoResolveDeal && (txn.merchantName ?? txn.name)) {
        // Auto-resolve: look up merchant by name, then find active deal
        const merchantTarget = (txn.merchantName ?? txn.name).toLowerCase();
        const [merchant] = await db
          .select({ id: merchants.id })
          .from(merchants)
          .where(
            and(
              eq(merchants.teamId, teamId),
              sql`LOWER(${merchants.name}) = ${merchantTarget}`,
            ),
          )
          .limit(1);

        if (merchant) {
          const [deal] = await db
            .select({ id: mcaDeals.id, dealCode: mcaDeals.dealCode })
            .from(mcaDeals)
            .where(
              and(
                eq(mcaDeals.merchantId, merchant.id),
                eq(mcaDeals.teamId, teamId),
                eq(mcaDeals.status, "active"),
              ),
            )
            .limit(1);

          if (deal) {
            updates.dealCode = deal.dealCode;
            updates.matchedDealId = deal.id;
            updates.matchStatus = "auto_matched";
            updates.matchRule = rule.name;
            updates.matchedAt = new Date().toISOString();
          }
        }
      }
```

Add the necessary imports at the top of the file:
```typescript
import { merchants, mcaDeals } from "@db/schema";
```

**Step 6: Commit**

```bash
git add packages/db/src/queries/transaction-rules.ts
git commit -m "feat: extend rules engine with deal assignment and date range filtering"
```

---

### Task 3: Extend tRPC router — add new rule fields to schemas

**Files:**
- Modify: `apps/api/src/trpc/routers/transaction-rules.ts:11-26` (createRuleSchema)

**Step 1: Add new fields to the Zod schemas**

In `createRuleSchema`, add after `setAssignedId`:
```typescript
  setDealCode: z.string().nullable().optional(),
  autoResolveDeal: z.boolean().optional(),
  dateStart: z.string().nullable().optional(),
  dateEnd: z.string().nullable().optional(),
```

No other router changes needed — `updateRuleSchema` already extends `createRuleSchema.partial()`.

**Step 2: Commit**

```bash
git add apps/api/src/trpc/routers/transaction-rules.ts
git commit -m "feat: add deal and date fields to transaction rules tRPC schema"
```

---

### Task 4: Add Deal column to transactions table + include dealCode in query

**Files:**
- Modify: `packages/db/src/queries/transactions.ts:404-512` (select fields in getTransactions)
- Modify: `apps/dashboard/src/components/tables/transactions/columns.tsx:288-623` (columns array)

**Step 1: Add dealCode to the getTransactions select**

In `packages/db/src/queries/transactions.ts`, in the `.select({})` block (around line 404), add after `enrichmentCompleted`:
```typescript
      dealCode: transactions.dealCode,
```

Also add `dealCode` to the `getTransactionById` select (around line 700).

**Step 2: Create a DealCell component and add the Deal column**

In `columns.tsx`, add a DealCell component:
```tsx
const DealCell = memo(
  ({ dealCode }: { dealCode: string | null }) => {
    if (!dealCode) {
      return (
        <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Unassigned
        </span>
      );
    }

    return (
      <span className="text-sm font-mono text-foreground">
        {dealCode}
      </span>
    );
  },
);

DealCell.displayName = "DealCell";
```

Add the Deal column to the `columns` array, inserting it after the "Type" column (after the `transactionType` column definition, around line 432):

```tsx
  {
    accessorKey: "dealCode",
    header: "Deal",
    size: 160,
    minSize: 120,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Deal",
      className: "w-[160px] min-w-[120px]",
    },
    cell: ({ row }) => <DealCell dealCode={row.original.dealCode ?? null} />,
  },
```

**Step 3: Remove the Assigned column**

Remove the entire `assigned` column definition (lines ~524-551) from the columns array. This removes the inline "Assign" column from the table.

**Step 4: Commit**

```bash
git add packages/db/src/queries/transactions.ts apps/dashboard/src/components/tables/transactions/columns.tsx
git commit -m "feat: add Deal column to transactions table, remove Assign column"
```

---

### Task 5: Add deal picker to transaction detail panel

**Files:**
- Modify: `apps/dashboard/src/components/transaction-details.tsx:365-397` (replace Assign section with Deal picker)

**Step 1: Replace the Assign section with a Deal picker**

Replace the "Assign" grid cell (lines ~374-396) with a Deal picker. The section currently shows `<AssignUser>`.

Replace with:
```tsx
        <div>
          <Label htmlFor="deal" className="mb-2 block">
            Deal
          </Label>

          {isLoading ? (
            <div className="h-[36px] border">
              <Skeleton className="h-[14px] w-[60%] absolute left-3 top-[39px]" />
            </div>
          ) : (
            <DealPicker
              selectedDealCode={data?.dealCode ?? undefined}
              onSelect={(dealCode) => {
                updateTransactionMutation.mutate({
                  id: data?.id,
                  dealCode,
                  matchStatus: "manual_matched",
                  matchedAt: new Date().toISOString(),
                });
              }}
            />
          )}
        </div>
```

**Step 2: Create the DealPicker component**

Create: `apps/dashboard/src/components/deal-picker.tsx`

```tsx
"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Props = {
  selectedDealCode?: string;
  onSelect: (dealCode: string | null) => void;
};

export function DealPicker({ selectedDealCode, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();

  const { data: deals } = useQuery({
    ...trpc.mcaDeals.get.queryOptions({}),
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !selectedDealCode && "text-muted-foreground",
          )}
        >
          {selectedDealCode ? (
            <span className="font-mono text-sm">{selectedDealCode}</span>
          ) : (
            "Select deal..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search deals..." />
          <CommandList>
            <CommandEmpty>No deals found.</CommandEmpty>
            <CommandGroup>
              {selectedDealCode && (
                <CommandItem
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              )}
              {deals?.data?.map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`${deal.dealCode} ${deal.merchantName ?? ""}`}
                  onSelect={() => {
                    onSelect(deal.dealCode);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{deal.dealCode}</span>
                    {deal.merchantName && (
                      <span className="text-xs text-muted-foreground">
                        {deal.merchantName}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 3: Import DealPicker in transaction-details.tsx**

Add at top:
```typescript
import { DealPicker } from "./deal-picker";
```

Remove unused `AssignUser` import if no longer used elsewhere in the file.

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/deal-picker.tsx apps/dashboard/src/components/transaction-details.tsx
git commit -m "feat: add deal picker to transaction detail panel, replace assign section"
```

---

### Task 6: Collapse attachments by default in transaction detail panel

**Files:**
- Modify: `apps/dashboard/src/components/transaction-details.tsx:241-242` (defaultValue array)

**Step 1: Remove "attachment" from the default open accordion items**

Change line 241 from:
```typescript
  const defaultValue = ["attachment"];
```
to:
```typescript
  const defaultValue: string[] = [];
```

The `note` accordion still opens if data has a note (line 243-245 remains unchanged).

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/transaction-details.tsx
git commit -m "feat: collapse attachments section by default in transaction details"
```

---

### Task 7: Extend rules modal UI — deal action + date range condition

**Files:**
- Modify: `apps/dashboard/src/components/modals/transaction-rules-modal.tsx`

**Step 1: Add new fields to RuleFormData type and emptyForm**

Update `RuleFormData` type (line 28):
```typescript
type RuleFormData = {
  name: string;
  merchantMatch: string;
  merchantMatchType: "contains" | "exact" | "starts_with";
  amountOperator: "eq" | "gt" | "lt" | "between" | null;
  amountValue: string;
  amountValueMax: string;
  setCategorySlug: string;
  setMerchantName: string;
  setDealCode: string;
  autoResolveDeal: boolean;
  dateStart: string;
  dateEnd: string;
};
```

Update `emptyForm` (line 38):
```typescript
const emptyForm: RuleFormData = {
  name: "",
  merchantMatch: "",
  merchantMatchType: "contains",
  amountOperator: null,
  amountValue: "",
  amountValueMax: "",
  setCategorySlug: "",
  setMerchantName: "",
  setDealCode: "",
  autoResolveDeal: false,
  dateStart: "",
  dateEnd: "",
};
```

**Step 2: Update handleEdit to populate new fields**

In `handleEdit` (line 128), add:
```typescript
      setDealCode: rule.setDealCode ?? "",
      autoResolveDeal: rule.autoResolveDeal ?? false,
      dateStart: rule.dateStart ?? "",
      dateEnd: rule.dateEnd ?? "",
```

**Step 3: Update handleSubmit to send new fields**

In `handleSubmit` (line 146), add to the payload:
```typescript
      setDealCode: form.setDealCode || null,
      autoResolveDeal: form.autoResolveDeal,
      dateStart: form.dateStart || null,
      dateEnd: form.dateEnd || null,
```

**Step 4: Add Date Range condition UI**

After the Amount criteria section (around line 378), add:
```tsx
                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Date range (optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={form.dateStart}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dateStart: e.target.value,
                        }))
                      }
                      placeholder="Start date"
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={form.dateEnd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dateEnd: e.target.value,
                        }))
                      }
                      placeholder="End date"
                      className="flex-1"
                    />
                  </div>
                </div>
```

**Step 5: Add Deal Assignment action UI**

After the "Rename merchant to" action (around line 415), add:
```tsx
                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Assign to deal
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Auto-resolve from merchant</span>
                      <Switch
                        checked={form.autoResolveDeal}
                        onCheckedChange={(checked) =>
                          setForm((f) => ({
                            ...f,
                            autoResolveDeal: checked,
                            setDealCode: checked ? "" : f.setDealCode,
                          }))
                        }
                      />
                    </div>
                    {!form.autoResolveDeal && (
                      <Input
                        value={form.setDealCode}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            setDealCode: e.target.value,
                          }))
                        }
                        placeholder="e.g., MCA-2025-001"
                      />
                    )}
                  </div>
                </div>
```

**Step 6: Commit**

```bash
git add apps/dashboard/src/components/modals/transaction-rules-modal.tsx
git commit -m "feat: add deal assignment and date range to rules modal UI"
```

---

### Task 8: Verify end-to-end and manual test

**Step 1: Start the dev server**

Run: `bun dev:dashboard` (should already be running on port 3001)

**Step 2: Test the rules modal**

1. Navigate to Transactions page
2. Click "Rules" button
3. Create a new rule with:
   - Name: "Sunrise Diner payments"
   - Merchant match: contains "Sunrise Diner"
   - Date range: 2026-01-01 to 2026-12-31
   - Assign to deal: MCA-2025-001
4. Verify the rule saves and appears in the list

**Step 3: Test the Deal column**

1. Verify the "Deal" column appears in the transactions table
2. Transactions with `deal_code` show the code in monospace
3. Unlinked transactions show "Unassigned" with amber dot
4. Verify "Assigned" column is gone

**Step 4: Test the detail panel**

1. Click a transaction to open the detail side panel
2. Verify "Deal" picker appears where "Assign" used to be
3. Select a deal from the dropdown
4. Verify the table updates to show the deal code
5. Verify attachments section is collapsed by default

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
