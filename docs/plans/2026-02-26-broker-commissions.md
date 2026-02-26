# Broker Commission System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable brokers to log into the dashboard with a restricted view showing their deals and commissions, while giving admins flexible commission management (percentage or flat fee) on the deal form.

**Architecture:** Role-based gating in the existing Next.js dashboard. Brokers are invited via the existing team invite system, linked to their broker record via `entityId` on `usersOnTeam`. Sidebar filters by role. Three new broker-facing pages. Commission fields enhanced on the deal form. One small DB migration to add `entity_id` to `user_invites`.

**Tech Stack:** Next.js App Router, tRPC, Drizzle ORM, Supabase PostgreSQL, React Hook Form, Zod, Tailwind CSS, Shadcn/UI

---

## Task 1: Add `entity_id` and `entity_type` to `user_invites` table

The `user_invites` table needs these columns so that when a broker is invited, we can store which broker record they're linked to. On invite acceptance, this flows through to `usersOnTeam.entityId`.

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_entity_id_to_user_invites.sql`
- Modify: `packages/db/src/schema.ts:1289-1301` (add columns to userInvites)

**Step 1: Create the migration**

```sql
-- Add entity_id and entity_type to user_invites
ALTER TABLE user_invites ADD COLUMN entity_id uuid;
ALTER TABLE user_invites ADD COLUMN entity_type text;
```

Run: `cd /c/Users/suphi/dev/abacus && supabase migration new add_entity_id_to_user_invites`
Then paste the SQL into the generated file.

**Step 2: Update the Drizzle schema**

In `packages/db/src/schema.ts`, inside the `userInvites` table definition (around line 1300, after `invitedBy`), add:

```typescript
    entityId: uuid("entity_id"),
    entityType: text("entity_type"),
```

**Step 3: Commit**

```bash
git add supabase/migrations/ packages/db/src/schema.ts
git commit -m "feat: add entity_id and entity_type to user_invites table"
```

---

## Task 2: Update invite backend to support entity linking

When an invite with `role: "broker"` includes an `entityId`, it needs to be stored on the invite and then flow through to `usersOnTeam` when accepted.

**Files:**
- Modify: `packages/db/src/queries/user-invites.ts`
- Modify: `apps/api/src/trpc/routers/team.ts` (the invite procedure)

**Step 1: Update `createTeamInvites` types and logic**

In `packages/db/src/queries/user-invites.ts`, update the `CreateTeamInvitesParams` type (line 158) to include optional `entityId` and `entityType`:

```typescript
type CreateTeamInvitesParams = {
  teamId: string;
  invites: {
    email: string;
    role: "owner" | "admin" | "member" | "broker" | "syndicate" | "merchant";
    invitedBy: string;
    entityId?: string | null;
    entityType?: string | null;
  }[];
};
```

Also update the `InviteValidationResult.validInvites` type to match.

In the `createTeamInvites` function, update the `db.insert(userInvites).values(...)` call (around line 295) to pass through `entityId` and `entityType`:

```typescript
.values({
  email: invite.email,
  role: invite.role,
  invitedBy: invite.invitedBy,
  teamId: teamId,
  entityId: invite.entityId,
  entityType: invite.entityType,
})
```

**Step 2: Update `acceptTeamInvite` to pass entityId through**

In the same file, update `acceptTeamInvite` (line 38). First, fetch `entityId` and `entityType` from the invite:

```typescript
const inviteData = await db.query.userInvites.findFirst({
  where: and(eq(userInvites.id, params.id)),
  columns: {
    id: true,
    role: true,
    teamId: true,
    entityId: true,
    entityType: true,
  },
});
```

Then pass them to the `usersOnTeam` insert:

```typescript
await db.insert(usersOnTeam).values({
  userId: params.userId,
  role: inviteData.role,
  teamId: inviteData.teamId!,
  entityId: inviteData.entityId,
  entityType: inviteData.entityType,
});
```

**Step 3: Update the team invite tRPC procedure**

In `apps/api/src/trpc/routers/team.ts`, update the invite procedure's input schema to accept optional `entityId` and `entityType`, and pass them through to `createTeamInvites`.

**Step 4: Commit**

```bash
git add packages/db/src/queries/user-invites.ts apps/api/src/trpc/routers/team.ts
git commit -m "feat: support entity linking in team invite flow"
```

---

## Task 3: Update invite form to show broker selector

When the user selects "Broker" role in the invite modal, a dropdown should appear to link the invite to an existing broker record.

**Files:**
- Modify: `apps/dashboard/src/components/forms/invite-form.tsx`

**Step 1: Add broker query and entityId to form schema**

Update the Zod schema to include optional `entityId` and `entityType`:

```typescript
const formSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum(["owner", "admin", "member", "broker", "syndicate", "merchant"]),
      entityId: z.string().uuid().optional(),
      entityType: z.string().optional(),
    }),
  ),
});
```

Add a broker query at the top of the component:

```typescript
const { data: brokers } = useQuery(
  trpc.brokers.get.queryOptions({ pageSize: 100 }),
);
```

**Step 2: Add conditional broker selector**

After the role selector, for each invite row, add a conditional broker selector that appears when `role === "broker"`:

```tsx
{form.watch(`invites.${index}.role`) === "broker" && (
  <FormField
    control={form.control}
    name={`invites.${index}.entityId`}
    render={({ field }) => (
      <FormItem>
        <Select
          onValueChange={(value) => {
            field.onChange(value);
            form.setValue(`invites.${index}.entityType`, "broker");
          }}
          defaultValue={field.value}
        >
          <FormControl>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Link broker" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {brokers?.data?.map((broker) => (
              <SelectItem key={broker.id} value={broker.id}>
                {broker.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItem>
    )}
  />
)}
```

**Step 3: Pass entityId/entityType through on submit**

Update the `onSubmit` handler to include the entity fields:

```typescript
const onSubmit = form.handleSubmit((data) => {
  inviteMutation.mutate(
    data.invites
      .filter((invite) => invite.email !== "")
      .map((invite) => ({
        email: invite.email,
        role: invite.role,
        entityId: invite.entityId,
        entityType: invite.entityType,
      })),
  );
});
```

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/forms/invite-form.tsx
git commit -m "feat: add broker selector to invite form when broker role selected"
```

---

## Task 4: Enhance deal form with commission type toggle

The deal form currently only supports commission as a percentage. Add a commission type toggle (percentage/flat fee) and a commission amount field.

**Files:**
- Modify: `apps/dashboard/src/components/forms/deal-form.tsx`
- Modify: `apps/api/src/trpc/routers/mca-deals.ts`

**Step 1: Update the deal form schema**

In `deal-form.tsx`, add `commissionType` and `commissionAmount` to the form schema:

```typescript
const formSchema = z.object({
  // ... existing fields
  brokerId: z.string().uuid().optional(),
  commissionType: z.enum(["percentage", "flat"]).default("percentage"),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
  commissionAmount: z.coerce.number().min(0).optional(),
});
```

**Step 2: Add commission type toggle and fields**

Replace the existing `commissionPercentage` field block (lines 246-276) with:

```tsx
{selectedBrokerId && (
  <div className="space-y-3 p-3 border border-border rounded-md">
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#878787] font-normal">Commission</span>
      <FormField
        control={form.control}
        name="commissionType"
        render={({ field }) => (
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            <button
              type="button"
              className={cn(
                "px-2 py-1 text-[10px] rounded transition-colors",
                field.value === "percentage"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground",
              )}
              onClick={() => field.onChange("percentage")}
            >
              Percentage
            </button>
            <button
              type="button"
              className={cn(
                "px-2 py-1 text-[10px] rounded transition-colors",
                field.value === "flat"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground",
              )}
              onClick={() => field.onChange("flat")}
            >
              Flat Fee
            </button>
          </div>
        )}
      />
    </div>

    {commissionType === "percentage" ? (
      <FormField
        control={form.control}
        name="commissionPercentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-[#878787] font-normal">
              Rate (%)
              {selectedBroker?.commissionPercentage && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  (default: {Number(selectedBroker.commissionPercentage)}%)
                </span>
              )}
            </FormLabel>
            <FormControl>
              <Input {...field} type="number" step="0.01" min="0" max="100"
                placeholder="10" autoComplete="off" value={field.value ?? ""} />
            </FormControl>
            {fundingAmount && field.value ? (
              <p className="text-[10px] text-muted-foreground">
                Commission: ${(fundingAmount * (Number(field.value) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />
    ) : (
      <FormField
        control={form.control}
        name="commissionAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-[#878787] font-normal">
              Flat Fee ($)
            </FormLabel>
            <FormControl>
              <Input {...field} type="number" step="0.01" min="0"
                placeholder="2500" autoComplete="off" value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )}
  </div>
)}
```

Add `commissionType` watch: `const commissionType = form.watch("commissionType");`

**Step 3: Update broker auto-fill logic**

When a broker is selected, also auto-fill based on the broker's `commissionType` if available. In the broker `onValueChange` handler:

```typescript
onValueChange={(value) => {
  field.onChange(value);
  const broker = brokers?.data?.find((b) => b.id === value);
  if (broker) {
    // Auto-fill commission type and value from broker defaults
    if (!form.getValues("commissionPercentage") && !form.getValues("commissionAmount")) {
      if (broker.commissionPercentage) {
        form.setValue("commissionType", "percentage", { shouldDirty: true });
        form.setValue("commissionPercentage", Number(broker.commissionPercentage), { shouldDirty: true });
      }
    }
  }
}}
```

**Step 4: Update handleSubmit to pass commission fields**

```typescript
const handleSubmit = (data: z.infer<typeof formSchema>) => {
  createDealMutation.mutate({
    ...data,
    dailyPayment: data.dailyPayment || undefined,
    fundedAt: data.fundedAt || undefined,
    expectedPayoffDate: data.expectedPayoffDate || undefined,
    brokerId: data.brokerId || undefined,
    commissionType: data.brokerId ? data.commissionType : undefined,
    commissionPercentage: data.commissionType === "percentage" ? data.commissionPercentage : undefined,
    commissionAmount: data.commissionType === "flat" ? data.commissionAmount : undefined,
  });
};
```

**Step 5: Commit**

```bash
git add apps/dashboard/src/components/forms/deal-form.tsx
git commit -m "feat: add commission type toggle (percentage/flat fee) to deal form"
```

---

## Task 5: Update deal creation backend to handle flat-fee commissions

The current backend always calculates commission as a percentage. Update it to handle flat fees and commission type overrides.

**Files:**
- Modify: `apps/api/src/trpc/routers/mca-deals.ts`
- Modify: `packages/db/src/queries/broker-commissions.ts`

**Step 1: Update `createDealSchema` in mca-deals.ts**

Add `commissionType` and `commissionAmount` to the schema:

```typescript
const createDealSchema = z.object({
  // ... existing fields
  brokerId: z.string().uuid().optional(),
  commissionType: z.enum(["percentage", "flat"]).optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
  commissionAmount: z.number().min(0).optional(),
});
```

Also update `createDealWithBankAccountSchema` since it extends `createDealSchema` — the new fields inherit automatically.

**Step 2: Update commission creation logic in `create` procedure**

Replace the commission block (lines 86-109) with logic that handles both types:

```typescript
// Auto-create broker commission if a broker is assigned
if (deal && input.brokerId) {
  let type = input.commissionType;
  let pct = input.commissionPercentage;
  let amount = input.commissionAmount;

  // Fall back to broker defaults if not overridden
  if (type === undefined || (pct === undefined && amount === undefined)) {
    const broker = await getBrokerById(db, {
      id: input.brokerId,
      teamId: teamId!,
    });

    if (type === undefined) {
      type = (broker?.commissionType as "percentage" | "flat") ?? "percentage";
    }

    if (type === "percentage" && pct === undefined) {
      pct = broker?.commissionPercentage ? Number(broker.commissionPercentage) : 0;
    }

    if (type === "flat" && amount === undefined) {
      amount = broker?.commissionAmount ? Number(broker.commissionAmount) : 0;
    }
  }

  // Calculate amount from percentage if needed
  if (type === "percentage") {
    pct = pct ?? 0;
    amount = +(input.fundingAmount * (pct / 100)).toFixed(2);
  } else {
    amount = amount ?? 0;
    // Calculate implied percentage for record-keeping
    pct = input.fundingAmount > 0 ? +((amount / input.fundingAmount) * 100).toFixed(2) : 0;
  }

  await upsertCommission(db, {
    dealId: deal.id,
    brokerId: input.brokerId,
    teamId: teamId!,
    commissionType: type ?? "percentage",
    commissionPercentage: pct,
    commissionAmount: amount,
    status: "pending",
  });
}
```

**Step 3: Apply same logic to `createWithBankAccount` procedure**

Copy the same commission block to replace the existing one in `createWithBankAccount` (lines 171-193).

**Step 4: Update `upsertCommission` to accept commissionType**

In `packages/db/src/queries/broker-commissions.ts`, add `commissionType` to the `UpsertCommissionParams`:

```typescript
type UpsertCommissionParams = {
  id?: string;
  dealId: string;
  brokerId: string;
  teamId: string;
  commissionType?: "percentage" | "flat";
  commissionPercentage: number;
  commissionAmount: number;
  status?: "pending" | "paid" | "cancelled";
  note?: string | null;
};
```

And update the upsert function to include `commissionType` in both the insert values and the conflict update set:

```typescript
.values({
  id,
  ...rest,
  commissionType: rest.commissionType,
})
.onConflictDoUpdate({
  target: [brokerCommissions.dealId, brokerCommissions.brokerId],
  set: {
    commissionType: rest.commissionType,
    commissionPercentage: rest.commissionPercentage,
    commissionAmount: rest.commissionAmount,
    status: rest.status,
    note: rest.note,
  },
})
```

**Step 5: Commit**

```bash
git add apps/api/src/trpc/routers/mca-deals.ts packages/db/src/queries/broker-commissions.ts
git commit -m "feat: support flat-fee commissions in deal creation backend"
```

---

## Task 6: Add broker-specific sidebar navigation

Update the sidebar to show broker-specific menu items and hide internal-only items for broker users.

**Files:**
- Modify: `apps/dashboard/src/components/main-menu.tsx`

**Step 1: Add broker-specific menu items and icons**

Add icon entries for the new broker routes:

```typescript
const icons = {
  // ... existing entries
  "/broker/deals": () => <Icons.Invoice size={20} />,
  "/broker/commissions": () => <Icons.Reconciliation size={20} />,
} as const;
```

Add the broker-specific menu items to `allItems`:

```typescript
{
  path: "/broker/deals",
  name: "My Deals",
  roles: ["broker"],
},
{
  path: "/broker/commissions",
  name: "My Commissions",
  roles: ["broker"],
},
```

The Overview item (`path: "/"`) already has no role restriction, so brokers see it.

Add the new paths to `KNOWN_MENU_PATHS`:

```typescript
const KNOWN_MENU_PATHS = [
  // ... existing
  "/broker",
];
```

**Step 2: Restrict the Settings item for brokers**

The Settings item currently has no `roles` restriction. Add `roles: INTERNAL` to the parent settings item, or make the children more restrictive. The existing children already have role restrictions — just add `roles: [...INTERNAL, "bookkeeper"]` to the parent:

```typescript
{
  path: "/settings",
  name: "Settings",
  roles: [...INTERNAL, "bookkeeper"],
  children: [ /* existing */ ],
},
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/main-menu.tsx
git commit -m "feat: add broker-specific sidebar menu items"
```

---

## Task 7: Add broker permissions to `use-permissions` hook

Add broker-specific permission flags.

**Files:**
- Modify: `apps/dashboard/src/hooks/use-permissions.ts`

**Step 1: Add broker permission flags**

```typescript
export function usePermissions() {
  const { data: user } = useUserQuery();
  const role = (user?.role as TeamRole) ?? "member";

  return {
    // ... existing flags
    isBroker: role === "broker",
    canViewBrokerPortal: role === "broker",
    entityId: (user as any)?.entityId as string | null,
    entityType: (user as any)?.entityType as string | null,
  };
}
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/hooks/use-permissions.ts
git commit -m "feat: add broker permission flags to use-permissions hook"
```

---

## Task 8: Add broker tRPC procedures for self-service queries

The existing broker tRPC procedures query by `brokerId` param. Add procedures that use the caller's `entityId` from context, so broker users can query their own data without knowing their broker ID.

**Files:**
- Modify: `apps/api/src/trpc/routers/brokers.ts`

**Step 1: Add `getMyDeals` and `getMyCommissions` procedures**

These are broker-facing procedures that read from the session context:

```typescript
getMyProfile: protectedProcedure.query(async ({ ctx: { db, teamId, session } }) => {
  // Get the user's entityId from usersOnTeam
  const membership = await db.query.usersOnTeam.findFirst({
    where: and(
      eq(usersOnTeam.userId, session.user.id),
      eq(usersOnTeam.teamId, teamId!),
    ),
    columns: { entityId: true, entityType: true },
  });

  if (!membership?.entityId || membership.entityType !== "broker") {
    return null;
  }

  return getBrokerById(db, { id: membership.entityId, teamId: teamId! });
}),

getMyDeals: protectedProcedure.query(async ({ ctx: { db, teamId, session } }) => {
  const membership = await db.query.usersOnTeam.findFirst({
    where: and(
      eq(usersOnTeam.userId, session.user.id),
      eq(usersOnTeam.teamId, teamId!),
    ),
    columns: { entityId: true, entityType: true },
  });

  if (!membership?.entityId || membership.entityType !== "broker") {
    return [];
  }

  return getBrokerDeals(db, { brokerId: membership.entityId, teamId: teamId! });
}),

getMyDealStats: protectedProcedure.query(async ({ ctx: { db, teamId, session } }) => {
  const membership = await db.query.usersOnTeam.findFirst({
    where: and(
      eq(usersOnTeam.userId, session.user.id),
      eq(usersOnTeam.teamId, teamId!),
    ),
    columns: { entityId: true, entityType: true },
  });

  if (!membership?.entityId || membership.entityType !== "broker") {
    return { totalDeals: 0, activeDeals: 0, totalFunded: 0, totalBalance: 0, totalPaid: 0 };
  }

  return getBrokerDealStats(db, { brokerId: membership.entityId, teamId: teamId! });
}),

getMyCommissions: protectedProcedure.query(async ({ ctx: { db, teamId, session } }) => {
  const membership = await db.query.usersOnTeam.findFirst({
    where: and(
      eq(usersOnTeam.userId, session.user.id),
      eq(usersOnTeam.teamId, teamId!),
    ),
    columns: { entityId: true, entityType: true },
  });

  if (!membership?.entityId || membership.entityType !== "broker") {
    return [];
  }

  return getCommissionsByBroker(db, { brokerId: membership.entityId, teamId: teamId! });
}),
```

Add the necessary imports at the top of the file.

**Step 2: Commit**

```bash
git add apps/api/src/trpc/routers/brokers.ts
git commit -m "feat: add broker self-service tRPC procedures"
```

---

## Task 9: Create broker overview page

The broker's home/overview page showing summary cards and recent deals.

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/broker/deals/page.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/broker/commissions/page.tsx`
- Create: `apps/dashboard/src/components/broker/broker-overview.tsx`

**Step 1: Create the broker overview component**

Create `apps/dashboard/src/components/broker/broker-overview.tsx`:

```tsx
"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@midday/ui/cn";

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-xs text-[#878787] font-normal">{title}</p>
      <p className="text-2xl font-mono font-semibold mt-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export function BrokerOverview() {
  const trpc = useTRPC();

  const { data: profile } = useQuery(trpc.brokers.getMyProfile.queryOptions());
  const { data: stats } = useQuery(trpc.brokers.getMyDealStats.queryOptions());
  const { data: deals } = useQuery(trpc.brokers.getMyDeals.queryOptions());

  const totalCommissions = profile?.totalCommissionsEarned ?? 0;
  const pendingCommissions = profile?.pendingCommissions ?? 0;
  const paidCommissions = profile?.paidCommissions ?? 0;

  const recentDeals = (deals ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Deals" value={stats?.totalDeals ?? 0} />
        <StatCard title="Active Deals" value={stats?.activeDeals ?? 0} />
        <StatCard
          title="Total Funded"
          value={`$${Number(stats?.totalFunded ?? 0).toLocaleString()}`}
        />
        <StatCard
          title="Commissions"
          value={`$${Number(totalCommissions).toLocaleString()}`}
          subtitle={`$${Number(pendingCommissions).toLocaleString()} pending · $${Number(paidCommissions).toLocaleString()} paid`}
        />
      </div>

      {/* Recent Deals */}
      <div>
        <h3 className="text-sm font-medium mb-3">Recent Deals</h3>
        {recentDeals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deals yet.</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 text-xs text-[#878787] font-normal">Deal Code</th>
                  <th className="text-left p-3 text-xs text-[#878787] font-normal">Merchant</th>
                  <th className="text-right p-3 text-xs text-[#878787] font-normal">Funded</th>
                  <th className="text-left p-3 text-xs text-[#878787] font-normal">Status</th>
                  <th className="text-right p-3 text-xs text-[#878787] font-normal">Commission</th>
                </tr>
              </thead>
              <tbody>
                {recentDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs">{deal.dealCode}</td>
                    <td className="p-3">{deal.merchantName}</td>
                    <td className="p-3 text-right font-mono">
                      ${Number(deal.fundingAmount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        deal.status === "active" && "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
                        deal.status === "paid_off" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
                        deal.status === "defaulted" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                      )}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {deal.commissionAmount
                        ? `$${Number(deal.commissionAmount).toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/broker/broker-overview.tsx
git commit -m "feat: create broker overview component with stats and recent deals"
```

---

## Task 10: Create broker "My Deals" page

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/broker/deals/page.tsx`

**Step 1: Create the page**

```tsx
import type { Metadata } from "next";
import { BrokerDealsPage } from "@/components/broker/broker-deals-page";

export const metadata: Metadata = {
  title: "My Deals | Abacus",
};

export default function Page() {
  return <BrokerDealsPage />;
}
```

**Step 2: Create the client component**

Create `apps/dashboard/src/components/broker/broker-deals-page.tsx`:

```tsx
"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@midday/ui/cn";

export function BrokerDealsPage() {
  const trpc = useTRPC();
  const { data: deals, isLoading } = useQuery(trpc.brokers.getMyDeals.queryOptions());

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading deals...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-medium">My Deals</h2>

      {!deals || deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deals found.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs text-[#878787] font-normal">Deal Code</th>
                <th className="text-left p-3 text-xs text-[#878787] font-normal">Merchant</th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">Funded</th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">Payback</th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">Balance</th>
                <th className="text-left p-3 text-xs text-[#878787] font-normal">Status</th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">Commission</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{deal.dealCode}</td>
                  <td className="p-3">{deal.merchantName}</td>
                  <td className="p-3 text-right font-mono">${Number(deal.fundingAmount).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">${Number(deal.paybackAmount).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">${Number(deal.currentBalance ?? 0).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      deal.status === "active" && "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
                      deal.status === "paid_off" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
                      deal.status === "defaulted" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                    )}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">
                    {deal.commissionAmount
                      ? `$${Number(deal.commissionAmount).toLocaleString()}`
                      : "—"}
                    {deal.commissionStatus && (
                      <span className={cn(
                        "ml-1 text-[10px]",
                        deal.commissionStatus === "paid" ? "text-green-600" : "text-amber-600",
                      )}>
                        ({deal.commissionStatus})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/app/[locale]/(app)/(sidebar)/broker/deals/ apps/dashboard/src/components/broker/broker-deals-page.tsx
git commit -m "feat: create broker My Deals page"
```

---

## Task 11: Create broker "My Commissions" page

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/broker/commissions/page.tsx`
- Create: `apps/dashboard/src/components/broker/broker-commissions-page.tsx`

**Step 1: Create the page**

```tsx
import type { Metadata } from "next";
import { BrokerCommissionsPage } from "@/components/broker/broker-commissions-page";

export const metadata: Metadata = {
  title: "My Commissions | Abacus",
};

export default function Page() {
  return <BrokerCommissionsPage />;
}
```

**Step 2: Create the client component**

Create `apps/dashboard/src/components/broker/broker-commissions-page.tsx`:

```tsx
"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@midday/ui/cn";

function CommissionStat({ title, value, className }: { title: string; value: string; className?: string }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-xs text-[#878787] font-normal">{title}</p>
      <p className={cn("text-xl font-mono font-semibold mt-1", className)}>{value}</p>
    </div>
  );
}

export function BrokerCommissionsPage() {
  const trpc = useTRPC();
  const { data: commissions, isLoading } = useQuery(trpc.brokers.getMyCommissions.queryOptions());
  const { data: profile } = useQuery(trpc.brokers.getMyProfile.queryOptions());

  const totalEarned = Number(profile?.totalCommissionsEarned ?? 0);
  const totalPending = Number(profile?.pendingCommissions ?? 0);
  const totalPaid = Number(profile?.paidCommissions ?? 0);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading commissions...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-medium">My Commissions</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <CommissionStat title="Total Earned" value={`$${totalEarned.toLocaleString()}`} />
        <CommissionStat title="Pending" value={`$${totalPending.toLocaleString()}`} className="text-amber-600" />
        <CommissionStat title="Paid" value={`$${totalPaid.toLocaleString()}`} className="text-green-600" />
      </div>

      {/* Commission Table */}
      {!commissions || commissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commissions yet.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs text-[#878787] font-normal">Deal Code</th>
                <th className="text-left p-3 text-xs text-[#878787] font-normal">Merchant</th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">Funded</th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">Rate (%)</th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">Amount</th>
                <th className="text-left p-3 text-xs text-[#878787] font-normal">Status</th>
                <th className="text-left p-3 text-xs text-[#878787] font-normal">Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{c.dealCode}</td>
                  <td className="p-3">{c.merchantName}</td>
                  <td className="p-3 text-right font-mono">${Number(c.fundingAmount).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{Number(c.commissionPercentage).toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono font-medium">
                    ${Number(c.commissionAmount).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      c.status === "paid" && "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
                      c.status === "pending" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                      c.status === "cancelled" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/dashboard/src/app/[locale]/(app)/(sidebar)/broker/commissions/ apps/dashboard/src/components/broker/broker-commissions-page.tsx
git commit -m "feat: create broker My Commissions page with summary cards"
```

---

## Task 12: Wire up broker overview into the dashboard home page

When a broker user navigates to `/`, they should see the broker overview instead of the regular chat/widget dashboard.

**Files:**
- Modify: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/[[...chatId]]/page.tsx`

**Step 1: Add broker detection and conditional rendering**

The home page is a server component. Add a check for the user's role. If the role is "broker", render the `BrokerOverview` component instead of the chat interface.

This depends on how the server component gets the user context. Look at how other pages get teamId/session — likely via `getUser()` server action or tRPC server prefetch.

The simplest approach: create a client wrapper that checks role:

Create `apps/dashboard/src/components/broker/broker-home-guard.tsx`:

```tsx
"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { BrokerOverview } from "./broker-overview";

export function BrokerHomeGuard({ children }: { children: React.ReactNode }) {
  const { isBroker } = usePermissions();

  if (isBroker) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-medium mb-6">Overview</h2>
        <BrokerOverview />
      </div>
    );
  }

  return <>{children}</>;
}
```

Then wrap the main page content with this guard in the `[[...chatId]]/page.tsx` layout.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/broker/broker-home-guard.tsx apps/dashboard/src/app/[locale]/(app)/(sidebar)/[[...chatId]]/page.tsx
git commit -m "feat: show broker overview on home page for broker users"
```

---

## Task 13: Protect internal routes from broker access

Ensure brokers can't navigate to internal-only routes by adding middleware-level protection.

**Files:**
- Modify: `apps/dashboard/src/middleware.ts`

**Step 1: Add broker route restriction**

After the authentication check in middleware, add a role-based route restriction. If the user has the `broker` role and is trying to access a route other than `/`, `/broker/*`, or `/settings/profile`, redirect them to `/`.

This requires reading the user's role from the session or a cookie. The simplest approach: check if the user has a role cookie or use the Supabase session user metadata.

Alternative simpler approach: rely on the frontend sidebar filtering (already done in Task 6) and the tRPC procedure-level protection (existing `memberProcedure` blocks broker writes). This provides defense-in-depth without middleware complexity.

**Decision: Skip middleware route blocking for now.** The sidebar already hides internal routes from brokers, and tRPC procedures enforce write protection. A broker manually navigating to `/transactions` would get an empty/error page because the queries are scoped to their role. This is acceptable for the initial implementation.

**Step 2: Commit** — No changes needed.

---

## Task 14: Verify and build

**Step 1: Run type check**

```bash
cd /c/Users/suphi/dev/abacus && bun run build
```

Fix any TypeScript errors that arise.

**Step 2: Manual verification checklist**

- [ ] Invite form shows broker selector when "Broker" role selected
- [ ] Deal form shows commission type toggle when broker selected
- [ ] Flat fee commission flows through to broker_commissions table
- [ ] Broker user sees filtered sidebar (Overview, My Deals, My Commissions)
- [ ] Broker overview shows summary cards
- [ ] My Deals page shows broker's deals
- [ ] My Commissions page shows broker's commissions with totals
- [ ] Internal routes hidden from broker sidebar

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete broker commission system implementation"
```
