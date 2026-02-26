# Broker Commission System Design

## Summary

Role-based broker portal within the existing dashboard, with flexible commission management (percentage or flat fee, per-broker defaults with per-deal overrides), admin invite-based onboarding, and view-only deal access for brokers.

## Approach

**Approach A: Minimal Role Gating** — Brokers log into the same dashboard with a filtered/restricted view based on their `broker` role. No separate app or layout branch. Leverages existing schema, auth, invite system, and role filtering.

## Data Model

**No new tables or migrations required.** The existing schema covers everything:

- `brokers` — broker entity with `commissionType` (percentage/flat), `commissionPercentage`, `commissionAmount` defaults
- `broker_commissions` — per-deal commission records with type, percentage, amount, status (pending/paid/cancelled)
- `mca_deals.brokerId` — links deals to their originating broker
- `usersOnTeam` — `entityId` stores broker record ID, `entityType` = "broker" for broker users

**Logic changes:**
- Update deal creation in `mca-deals.ts` to handle flat-fee commissions (use `commissionAmount` directly instead of calculating from percentage)
- Support per-deal commission type/value overrides on deal create/edit
- When broker is removed from a deal, cancel existing commission
- When broker changes on a deal, cancel old commission, create new one

## Broker Invitation & Onboarding

1. Admin creates broker record via existing broker form
2. Admin invites broker via existing invite system (`/settings/members`) with `role: "broker"`
3. When `broker` role is selected in invite modal, show broker selector to link invite to existing broker record
4. On invite acceptance, `usersOnTeam` record created with `entityId = brokerId`, `entityType = "broker"`
5. Broker logs in via standard Supabase Auth — middleware detects broker role, shows filtered dashboard

Alternative: "Invite to portal" checkbox on the broker form triggers the invite flow directly.

## Broker Dashboard Experience

### Sidebar (filtered by role)
- **Overview** — personalized broker dashboard
- **My Deals** — deals they originated
- **My Commissions** — commission summary and history

No access to: merchants, transactions, settings, team management, reconciliation, etc.

### Overview Page
- Summary cards: Total Deals, Active Deals, Total Funding Volume, Commissions (Earned / Pending / Paid)
- Recent deals table (last 5-10)

### My Deals Page
- DataTable filtered to `brokerId = entityId`
- Columns: Deal Code, Merchant Name, Funding Amount, Payback Amount, Status, Funded Date
- View-only — no create/edit actions
- Click to view deal detail (read-only) + their commission

### My Commissions Page
- Table of all their commissions
- Columns: Deal Code, Merchant, Commission Type, Amount, Status, Paid Date
- Summary cards: Total Earned, Total Pending, Total Paid

## Admin-Side Commission Management

### Deal Form Enhancement
When a broker is selected on the deal form:
1. **Commission type** toggle: Percentage / Flat Fee
2. **Value field**: percentage (0-100) or dollar amount
3. Auto-populated from broker's default commission settings
4. Admin can override for this specific deal
5. Preview: shows calculated commission amount (e.g., "$2,500 on $50,000 funding")

### Commission Lifecycle
- Deal created with broker → commission auto-created as `pending`
- Admin can mark commission `paid` (records `paidAt` timestamp)
- Admin can cancel a commission
- Broker removed from deal → commission cancelled
- Broker changed on deal → old commission cancelled, new one created

### Broker Detail Page (`/brokers/[id]`)
- Existing commissions tab shows all commissions for that broker
- Status management: pending → paid, or cancel

## Key Files to Modify

**Backend:**
- `apps/api/src/trpc/routers/mca-deals.ts` — commission calculation logic
- `apps/api/src/trpc/routers/brokers.ts` — may need updates for portal auth queries
- `packages/db/src/queries/broker-commissions.ts` — flat-fee support

**Frontend:**
- `apps/dashboard/src/components/main-menu.tsx` — broker role sidebar items
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/` — new broker-specific pages
- Deal form components — commission type/value fields
- Invite modal — broker selector when role is "broker"
- `apps/dashboard/src/hooks/use-permissions.ts` — broker-specific permissions if needed

## Non-Goals (YAGNI)
- Broker self-registration
- Broker deal submission
- Separate broker app/portal
- Tiered commission rules
- Commission payout automation (ACH/wire)
- Broker analytics/charts
