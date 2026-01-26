# Week 3 PRD: Payment Sync & Ledger

## Phase
**DATA FOUNDATION** (Weeks 1-4) — Week 3 of 4

## Sprint Goal

**Goal**: Sync payment data from Google Sheets to Abacus and calculate accurate running balances, NSF fees, and paid percentages for each deal.

**Demo**: User views a deal → sees complete payment history timeline → running balance updates correctly → NSF payments show $35 fee applied → paid percentage matches spreadsheet calculation.

---

## Context

Week 2 established deal sync and column mappings. Now we need to sync the payment data that makes the portfolio actionable — operators need to see who's paying, who's behind, and what's owed.

### Why This Matters
- **Real-time visibility** — Know payment status without checking spreadsheets
- **Balance accuracy** — Running balance must match spreadsheet formulas exactly
- **Collections foundation** — NSF tracking enables the Week 9 collections workflow
- **Merchant portal data** — Merchants see their payment history in the portal

### Technical Foundation Available
- Deal sync from Week 2 (deals in `mca_deals` table)
- Column mappings configured
- `mca_payments` table schema ready
- Spreadsheet logic analysis from Week 2 (knows fee structures)

---

## Task Breakdown

### Task 1: Payment Sheet Sync (PMT → mca_payments)

**Description**: Sync payment data from the PMT (payments) sheet to the `mca_payments` table, linking each payment to its parent deal.

**Validation**:
- [ ] Identifies and reads from PMT sheet in connected spreadsheet
- [ ] Maps payment columns (date, amount, status, type)
- [ ] Links payments to deals via deal_code
- [ ] Creates records in `mca_payments` table
- [ ] Handles multiple payment sheets (if customer has separate sheets per month)
- [ ] Upserts on (deal_id, payment_date, payment_sequence) to prevent duplicates
- [ ] Supports incremental sync (only new payments since last sync)

**Files**:
- `packages/jobs/src/tasks/sheets-sync.ts` — Extend to sync payments
- `packages/db/src/queries/mca-payments.ts` — Payment CRUD queries (create)
- `apps/api/src/rest/routers/google-sheets.ts` — Extend sync endpoint

**Payment Fields to Map**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| deal_code | string | Yes | Links to parent deal |
| payment_date | date | Yes | When payment occurred |
| amount | number | Yes | Payment amount |
| status | enum | Yes | Successful, NSF, Pending |
| payment_type | enum | No | ACH, Wire, Check, Card |
| reference_number | string | No | Bank reference |
| notes | string | No | Payment notes |

**Sync Flow**:
```
1. Fetch payment sheet data
2. Apply column mappings (reuse Week 2 UI with payment fields)
3. Lookup deal_id from deal_code
4. Validate required fields
5. Upsert to mca_payments
6. Update deal's last_payment_date
```

---

### Task 2: Ledger Balance Calculation

**Description**: Calculate running balance for each deal based on payment history. Balance = Payback Amount - Sum(Successful Payments) + Sum(NSF Fees).

**Validation**:
- [ ] Running balance calculated per deal
- [ ] Balance = payback_amount - successful_payments + fees
- [ ] Recalculates on each sync
- [ ] Matches spreadsheet formula results (within $0.01)
- [ ] Handles partial payments correctly
- [ ] Stores calculated balance in `mca_deals.current_balance`
- [ ] Balance visible in deal detail view

**Files**:
- `packages/db/src/queries/mca-deals.ts` — Add balance calculation query
- `packages/jobs/src/tasks/sheets-sync.ts` — Trigger balance recalc after payment sync
- Database: Add `current_balance` column to `mca_deals`

**Balance Formula**:
```sql
current_balance = payback_amount
                - SUM(payments WHERE status = 'successful')
                + (COUNT(payments WHERE status = 'nsf') * nsf_fee_amount)
```

**Example**:
| Item | Amount |
|------|--------|
| Payback Amount | $13,500 |
| - Successful Payments | -$8,000 |
| + NSF Fees (2 × $35) | +$70 |
| **Current Balance** | **$5,570** |

---

### Task 3: NSF Fee Logic

**Description**: Apply $35 NSF (Non-Sufficient Funds) fee for each failed payment, tracking fees separately for reporting and merchant visibility.

**Validation**:
- [ ] NSF payments identified by status = 'nsf'
- [ ] $35 fee applied per NSF (configurable per team)
- [ ] Fees added to balance calculation
- [ ] NSF count tracked per deal (`mca_deals.nsf_count`)
- [ ] Fee transactions logged in `mca_payment_fees` table
- [ ] Fees visible in deal detail and payment timeline
- [ ] Monthly NSF fee total available for reporting

**Files**:
- `packages/db/src/queries/mca-payments.ts` — NSF detection and fee creation
- Database: Add `mca_payment_fees` table for fee tracking
- Database: Add `nsf_count` and `nsf_fee_total` to `mca_deals`

**Fee Record Structure**:
```typescript
interface PaymentFee {
  id: string;
  dealId: string;
  paymentId: string;
  feeType: 'nsf' | 'late' | 'other';
  amount: number; // $35 default
  createdAt: Date;
}
```

**Team Configuration**:
```typescript
// Allow teams to customize NSF fee amount
team_settings.nsf_fee_amount = 35; // default
```

---

### Task 4: Paid Percentage Calculation

**Description**: Calculate what percentage of the total payback amount has been collected, enabling "almost paid off" and progress tracking.

**Validation**:
- [ ] Paid percentage = (successful_payments / payback_amount) × 100
- [ ] Stored in `mca_deals.paid_percentage`
- [ ] Updated on each payment sync
- [ ] Displayed in deal list and detail views
- [ ] Enables filtering (e.g., "Show deals 90%+ paid")
- [ ] Progress bar visualization in UI

**Files**:
- `packages/db/src/queries/mca-deals.ts` — Add paid percentage calculation
- `apps/dashboard/src/components/deals/deal-progress-bar.tsx` — Progress visualization (create)

**Calculation**:
```sql
paid_percentage = ROUND(
  (SUM(payments WHERE status = 'successful') / payback_amount) * 100,
  2
)
```

**UI Segments**:
| Range | Label | Color |
|-------|-------|-------|
| 0-25% | Early | Gray |
| 25-50% | In Progress | Blue |
| 50-75% | Halfway | Blue |
| 75-90% | Almost There | Green |
| 90-100% | Nearly Done | Green |
| 100%+ | Paid Off | Green (completed) |

---

### Task 5: Payment History Display

**Description**: Show complete payment history on the deal detail page with a timeline view showing each payment, fees, and running balance.

**Validation**:
- [ ] Payment timeline visible on deal detail page
- [ ] Shows date, amount, status, running balance for each payment
- [ ] NSF payments highlighted in red with fee notation
- [ ] Most recent payments at top (reverse chronological)
- [ ] Pagination for deals with 100+ payments
- [ ] Export to CSV option
- [ ] Running balance shown after each payment

**Files**:
- `apps/dashboard/src/components/deals/payment-timeline.tsx` — Timeline component (create)
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/portfolio/[dealId]/page.tsx` — Add to deal detail
- `apps/api/src/trpc/routers/mca-deals.ts` — Add payments query

**Timeline Entry Design**:
```
┌─────────────────────────────────────────────────┐
│ Jan 15, 2026                      Balance: $5,500│
│ ├─ $500.00 Payment (ACH)               ✓ Success │
│                                                  │
│ Jan 14, 2026                      Balance: $6,035│
│ ├─ $500.00 Payment (ACH)               ✗ NSF     │
│ │  └─ $35.00 NSF Fee Applied                     │
│                                                  │
│ Jan 13, 2026                      Balance: $6,000│
│ ├─ $500.00 Payment (ACH)               ✓ Success │
└─────────────────────────────────────────────────┘
```

---

## Exit Criteria

### Core Functionality
- [ ] Payment data syncs from Google Sheet to database
- [ ] Running balance calculates correctly (matches spreadsheet)
- [ ] NSF fees ($35 each) applied and tracked
- [ ] Paid percentage updates after each sync
- [ ] Payment history displays on deal detail page

### Data Accuracy
- [ ] Balance matches spreadsheet calculation within $0.01
- [ ] NSF count matches number of failed payments
- [ ] Paid percentage mathematically correct
- [ ] No duplicate payments after multiple syncs

### Technical
- [ ] `bun build` passes without errors
- [ ] Payment sync completes in < 30 seconds for 1000 payments
- [ ] Incremental sync only processes new payments
- [ ] Database queries optimized with proper indexes

---

## Technical Notes

### Database Schema Additions

```sql
-- Add to mca_deals
ALTER TABLE mca_deals ADD COLUMN current_balance DECIMAL(12,2);
ALTER TABLE mca_deals ADD COLUMN paid_percentage DECIMAL(5,2);
ALTER TABLE mca_deals ADD COLUMN nsf_count INTEGER DEFAULT 0;
ALTER TABLE mca_deals ADD COLUMN nsf_fee_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE mca_deals ADD COLUMN last_payment_date TIMESTAMP;

-- Payment fees table
CREATE TABLE mca_payment_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES mca_deals(id),
  payment_id UUID REFERENCES mca_payments(id),
  fee_type VARCHAR(20) NOT NULL, -- 'nsf', 'late', 'other'
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mca_payments_deal_id ON mca_payments(deal_id);
CREATE INDEX idx_mca_payments_date ON mca_payments(payment_date);
CREATE INDEX idx_mca_payment_fees_deal_id ON mca_payment_fees(deal_id);
```

### Balance Calculation Query

```sql
WITH payment_totals AS (
  SELECT
    deal_id,
    SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) as collected,
    COUNT(CASE WHEN status = 'nsf' THEN 1 END) as nsf_count
  FROM mca_payments
  GROUP BY deal_id
)
UPDATE mca_deals d
SET
  current_balance = d.payback_amount - COALESCE(pt.collected, 0) + (COALESCE(pt.nsf_count, 0) * 35),
  paid_percentage = ROUND((COALESCE(pt.collected, 0) / d.payback_amount) * 100, 2),
  nsf_count = COALESCE(pt.nsf_count, 0),
  nsf_fee_total = COALESCE(pt.nsf_count, 0) * 35
FROM payment_totals pt
WHERE d.id = pt.deal_id;
```

### Sync Order
```
1. Sync deals first (Week 2)
2. Sync payments (links to deals)
3. Calculate balances (depends on payments)
4. Update deal statistics (nsf_count, paid_percentage)
```

### Reference Files
- Deal sync: `packages/jobs/src/tasks/sheets-sync.ts`
- MCA schema: `supabase/migrations/20260125000000_add_mca_merchant_portal_tables.sql`
- Payment queries: `packages/db/src/queries/mca-payments.ts` (to create)

---

## Verification

After implementation:
1. Run `bun build` — must pass
2. Run `supabase db push` — migrations apply cleanly
3. Manual test: Sync deals → Sync payments → Verify balance calculation
4. Compare: Check 5 random deals' balances against spreadsheet formulas
5. NSF test: Verify NSF payments add $35 fee to balance
6. Check merchant portal: Payments visible with correct history

---

## Customer Milestone

**Week 4 Target**: Both pilot customers synced with accurate balances

Week 3 delivers the "truth" that makes Abacus valuable — accurate balances and payment history. Without this, the spreadsheet remains the source of truth. With this, Abacus becomes the system of record.
