# Midday Design Alignment - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all UI deviations from Midday's design patterns in agent-created Abacus components

**Architecture:** The base UI primitives (badge, button, card, table, input, skeleton, dialog, tooltip) are identical to Midday. All deviations are in dashboard-level components created by agents: the broker module and collections module. Fixes involve replacing Tailwind color tokens with Midday's hex values, fixing font sizes, and ensuring proper capitalization.

**Tech Stack:** React, TypeScript, Tailwind CSS, CVA, Radix UI

---

## Audit Results Summary

### Base UI Components (packages/ui/) - ALL PASS
- badge.tsx - IDENTICAL to Midday
- button.tsx - IDENTICAL to Midday
- card.tsx - IDENTICAL to Midday
- table.tsx - IDENTICAL to Midday
- input.tsx - IDENTICAL to Midday
- skeleton.tsx - IDENTICAL to Midday
- dialog.tsx - IDENTICAL to Midday
- tooltip.tsx - IDENTICAL to Midday

### MCA Status Components - ALL PASS
- deal-status.tsx - Follows Midday InvoiceStatus pattern exactly
- deal-status-badge.tsx - Correct hex colors, text-[11px], Title Case labels
- disclosure-status-badge.tsx - Correct colors, dimensions, labels
- match-status-badge.tsx - Correct colors, dimensions, labels
- order-status.tsx - IDENTICAL to Midday

### Deviations Found

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | CRITICAL | broker/shared.tsx - DealStatusBadge | Uses Tailwind tokens (bg-green-100) instead of Midday hex (#00C969/#DDF1E4), wrong font size (text-xs vs text-[11px]), no proper capitalization |
| 2 | CRITICAL | broker/shared.tsx - CommissionStatusBadge | Uses Tailwind tokens instead of Midday hex, wrong font size, raw status text without capitalization |
| 3 | CRITICAL | case-detail-header.tsx:207 | Priority displayed raw without capitalize class |
| 4 | MODERATE | broker/shared.tsx - StatCard | Uses rounded-lg border (Midday uses sharp corners on cards) |
| 5 | MODERATE | collections/columns.tsx - PriorityCell | Uses #eab308 (should be #FFD02B) and #6b7280 (should be #878787) |
| 6 | MODERATE | collections/columns.tsx - stageColorMap | Uses Tailwind defaults (#ef4444, #22c55e, #3b82f6) instead of Midday hex (#FF3638, #00C969, #1F6FEB) |
| 7 | MODERATE | case-detail-header.tsx:162 | Outcome badge uses px-3 py-1 text-[12px] instead of px-2 py-0.5 text-[11px] |
| 8 | MINOR | broker/shared.tsx - CommissionStatusLabel | Uses Tailwind tokens (text-green-600) instead of hex |

---

## Midday Convention Reference

### Status Badge Dimensions
```
Standard pill: px-2 py-0.5 rounded-full text-[11px]
Draft/Canceled: same pill but text-[10px]
Inbox badges: px-1.5 py-0.5 text-[10px] border (square)
```

### Status Color Palette (hex values)
```
Success/Active/Paid:    text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10
Warning/Pending/Overdue: text-[#FFD02B] bg-[#FFD02B]/10
Info/Scheduled:         text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10
Error/Failed/Danger:    text-[#FF3638] bg-[#FF3638]/10
Neutral/Draft/Muted:    text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]
Orange/Refunded/Late:   text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10
```

### Capitalization
- Title Case for all status labels ("Active", "Paid Off", "Pending")
- CSS `capitalize` on raw strings is acceptable (Midday's OrderStatus does this)
- Never display raw snake_case ("paid_off") - always transform

### Card Styling
- No rounded corners (Midday uses sharp borders)
- `border bg-background text-card-foreground`

---

## Task 1: Fix broker/shared.tsx - DealStatusBadge

**Files:**
- Modify: `apps/dashboard/src/components/broker/shared.tsx:24-48`

**Step 1: Replace DealStatusBadge with Midday-aligned version**

```tsx
export function DealStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    active: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
    paid_off: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
    defaulted: "text-[#FF3638] bg-[#FF3638]/10",
    paused: "text-[#FFD02B] bg-[#FFD02B]/10",
    late: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
    in_collections: "text-[#FF3638] bg-[#FF3638]/10",
  };

  const statusLabels: Record<string, string> = {
    active: "Active",
    paid_off: "Paid Off",
    defaulted: "Default",
    paused: "Paused",
    late: "Late",
    in_collections: "Collections",
  };

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[status] || "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {statusLabels[status] || status}
      </span>
    </div>
  );
}
```

**Step 2: Verify no breaking changes**

Run: `cd /c/Users/suphi/dev/abacus && bun build --filter=@midday/dashboard 2>&1 | head -20`
Expected: Build succeeds (DealStatusBadge interface unchanged)

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/broker/shared.tsx
git commit -m "fix(broker): align DealStatusBadge with Midday hex palette and text-[11px]"
```

---

## Task 2: Fix broker/shared.tsx - CommissionStatusBadge

**Files:**
- Modify: `apps/dashboard/src/components/broker/shared.tsx:50-74`

**Step 1: Replace CommissionStatusBadge with Midday-aligned version**

```tsx
export function CommissionStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    paid: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
    pending: "text-[#FFD02B] bg-[#FFD02B]/10",
    cancelled: "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
  };

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[status] || "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
      )}
    >
      <span className="line-clamp-1 truncate inline-block capitalize">
        {status}
      </span>
    </div>
  );
}
```

**Step 2: Fix CommissionStatusLabel**

```tsx
export function CommissionStatusLabel({ status }: { status: string }) {
  const color = status === "paid" ? "text-[#00C969]" : "text-[#FFD02B]";
  return <span className={cn("ml-1 text-[10px]", color)}>({status})</span>;
}
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/broker/shared.tsx
git commit -m "fix(broker): align CommissionStatusBadge and Label with Midday palette"
```

---

## Task 3: Fix broker/shared.tsx - StatCard rounded corners

**Files:**
- Modify: `apps/dashboard/src/components/broker/shared.tsx:10-22`

**Step 1: Remove rounded-lg from StatCard**

Change:
```tsx
<div className="border border-border rounded-lg p-4">
```

To:
```tsx
<div className="border border-border p-4">
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/broker/shared.tsx
git commit -m "fix(broker): remove rounded corners from StatCard to match Midday"
```

---

## Task 4: Fix collections/columns.tsx - PriorityCell colors

**Files:**
- Modify: `apps/dashboard/src/components/tables/collections/columns.tsx:92-97`

**Step 1: Replace priorityStyles with Midday-aligned colors**

Change:
```tsx
const priorityStyles: Record<string, string> = {
  critical: "text-[#FF3638] bg-[#FF3638]/10",
  high: "text-[#f97316] bg-[#f97316]/10",
  medium: "text-[#eab308] bg-[#eab308]/10",
  low: "text-[#6b7280] bg-[#6b7280]/10",
};
```

To:
```tsx
const priorityStyles: Record<string, string> = {
  critical: "text-[#FF3638] bg-[#FF3638]/10",
  high: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  medium: "text-[#FFD02B] bg-[#FFD02B]/10",
  low: "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
};
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/tables/collections/columns.tsx
git commit -m "fix(collections): align priority colors with Midday hex palette"
```

---

## Task 5: Fix collections/columns.tsx - stageColorMap

**Files:**
- Modify: `apps/dashboard/src/components/tables/collections/columns.tsx:56-64`

**Step 1: Replace stageColorMap with Midday-aligned colors**

Change:
```tsx
const stageColorMap: Record<string, string> = {
  "#ef4444": "text-[#ef4444] bg-[#ef4444]/10",
  "#f97316": "text-[#f97316] bg-[#f97316]/10",
  "#eab308": "text-[#eab308] bg-[#eab308]/10",
  "#22c55e": "text-[#22c55e] bg-[#22c55e]/10",
  "#3b82f6": "text-[#3b82f6] bg-[#3b82f6]/10",
  "#8b5cf6": "text-[#8b5cf6] bg-[#8b5cf6]/10",
  "#6b7280": "text-[#6b7280] bg-[#6b7280]/10",
};
```

To:
```tsx
const stageColorMap: Record<string, string> = {
  "#FF3638": "text-[#FF3638] bg-[#FF3638]/10",
  "#F97316": "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  "#FFD02B": "text-[#FFD02B] bg-[#FFD02B]/10",
  "#00C969": "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  "#1F6FEB": "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  "#878787": "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
};
```

**Important:** This also requires updating the collection_stages seed/config data in the database to use these hex values instead of the Tailwind defaults. Check the stages-settings component to see if these colors are user-configurable.

**Step 2: Check if stage colors come from database**

Read: `apps/dashboard/src/components/collections/settings/stages-settings.tsx`

If stage colors are stored in the database with Tailwind default hex values (#ef4444, etc.), we need to either:
- A) Update the seed data to use Midday hex values
- B) Create a color mapping function that maps Tailwind hex → Midday hex

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/tables/collections/columns.tsx
git commit -m "fix(collections): align stage color map with Midday hex palette"
```

---

## Task 6: Fix case-detail-header.tsx - priority capitalization and outcome badge

**Files:**
- Modify: `apps/dashboard/src/components/collections/case-detail-header.tsx`

**Step 1: Fix priority display (line 207)**

Change:
```tsx
{data.priority}
```

To:
```tsx
<span className="capitalize">{data.priority}</span>
```

**Step 2: Fix priorityStyles in this file too (line 40-45)**

Change:
```tsx
const priorityStyles: Record<string, string> = {
  critical: "text-[#FF3638] bg-[#FF3638]/10",
  high: "text-[#f97316] bg-[#f97316]/10",
  medium: "text-[#eab308] bg-[#eab308]/10",
  low: "text-[#6b7280] bg-[#6b7280]/10",
};
```

To:
```tsx
const priorityStyles: Record<string, string> = {
  critical: "text-[#FF3638] bg-[#FF3638]/10",
  high: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  medium: "text-[#FFD02B] bg-[#FFD02B]/10",
  low: "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
};
```

**Step 3: Fix outcome badge dimensions (line 162)**

Change:
```tsx
<div className="px-3 py-1 rounded-full text-[12px] font-medium bg-[#DDF1E4] text-[#00C969]">
```

To:
```tsx
<div className="px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px] font-medium bg-[#DDF1E4] text-[#00C969] dark:bg-[#00C969]/10">
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/collections/case-detail-header.tsx
git commit -m "fix(collections): align priority colors, capitalization, and outcome badge with Midday"
```

---

## Task 7: Verify build and run visual check

**Step 1: Build the dashboard**

Run: `cd /c/Users/suphi/dev/abacus && bun build --filter=@midday/dashboard`
Expected: Build succeeds with no errors

**Step 2: Visual spot-check (if dev server available)**

Check these pages for visual consistency:
- /brokers page - verify DealStatusBadge colors
- /broker/deals - verify CommissionStatusBadge
- /collections - verify stage badges and priority badges
- /collections/[id] - verify priority dropdown and outcome badge

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: verify Midday design alignment audit complete"
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `apps/dashboard/src/components/broker/shared.tsx` | Tasks 1-3: DealStatusBadge, CommissionStatusBadge, CommissionStatusLabel, StatCard |
| `apps/dashboard/src/components/tables/collections/columns.tsx` | Tasks 4-5: priorityStyles, stageColorMap |
| `apps/dashboard/src/components/collections/case-detail-header.tsx` | Task 6: priorityStyles, priority capitalize, outcome badge |

**Total: 3 files, 8 deviations fixed**
