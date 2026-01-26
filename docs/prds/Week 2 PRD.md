# Week 2 PRD: Column Mapping & Initial Sync

## Phase
**DATA FOUNDATION** (Weeks 1-4) — Week 2 of 4

## Sprint Goal

**Goal**: Map spreadsheet columns to MCA fields using AI-powered suggestions and sync deal data from Google Sheets to the database.

**Demo**: User opens connected spreadsheet settings → sees AI-suggested column mappings → confirms/adjusts mappings → clicks "Sync Now" → sees deals appear in portfolio dashboard with sync status indicator.

---

## Context

Week 1 established the Google Sheets OAuth connection. Now we need to make that data usable by mapping arbitrary spreadsheet columns to Abacus's standardized MCA fields and syncing the data.

### Why This Matters
- **Zero-friction onboarding** — AI suggests mappings instead of manual configuration
- **Spreadsheet logic analysis** — Understands factor rates, fee structures, balance formulas automatically
- **40+ hours saved** — Manual spreadsheet analysis takes days; AI does it in minutes
- **Foundation for Week 3** — Payment sync depends on correct column mappings

### Technical Foundation Available
- Google Sheets connection from Week 1 (`google_sheets_connections` table)
- `googleapis` library for reading spreadsheet data
- Claude API for AI-powered column analysis
- `mca_deals` table schema ready for deal data

---

## Task Breakdown

### Task 1: Column Mapping Configuration UI

**Description**: Build the interface for mapping spreadsheet columns to MCA deal fields. Show a side-by-side view of spreadsheet columns and Abacus fields with dropdown selectors.

**Validation**:
- [ ] Column mapping page accessible from connected sheet settings
- [ ] Displays all detected columns from connected spreadsheet
- [ ] Shows all required MCA fields (merchant_name, funded_amount, factor_rate, etc.)
- [ ] Dropdown selector to map each spreadsheet column to an Abacus field
- [ ] Visual indicator for required vs optional fields
- [ ] Save button persists mappings to database
- [ ] Mobile responsive layout

**Files**:
- `apps/dashboard/src/app/[locale]/(app)/settings/integrations/sheets/[connectionId]/mapping/page.tsx` — Mapping page (create)
- `apps/dashboard/src/components/sheets/column-mapping-form.tsx` — Mapping form component (create)
- `packages/db/src/schema.ts` — Add `column_mappings` JSON field to google_sheets_connections table

**MCA Fields to Map**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| merchant_name | string | Yes | Business name |
| deal_code | string | Yes | Unique deal identifier |
| funded_amount | number | Yes | Principal amount funded |
| factor_rate | number | Yes | Multiplier (e.g., 1.35) |
| payback_amount | number | Yes | Total amount to repay |
| payment_amount | number | Yes | Daily/weekly payment amount |
| payment_frequency | enum | Yes | Daily, Weekly, Monthly |
| start_date | date | Yes | Funding date |
| status | enum | No | Active, Paid Off, Defaulted |
| merchant_email | string | No | For portal invites |
| merchant_phone | string | No | Contact number |

---

### Task 2: AI Column Mapping Suggestions

**Description**: Use Claude to analyze spreadsheet column names and sample data to suggest appropriate field mappings automatically.

**Validation**:
- [ ] On page load, AI analyzes column names and first 10 rows of data
- [ ] Suggestions appear as pre-selected values in mapping dropdowns
- [ ] Confidence indicator shows how certain AI is about each mapping
- [ ] User can accept, reject, or modify suggestions
- [ ] Works for common column naming patterns (e.g., "Amt Funded" → funded_amount)
- [ ] Handles variations (Merchant, Business Name, Company → merchant_name)

**Files**:
- `apps/api/src/rest/routers/google-sheets.ts` — Add `POST /suggest-mappings` endpoint
- `packages/ai/src/column-mapping.ts` — AI mapping logic (create package if needed)

**Example Prompt Structure**:
```
You are analyzing a spreadsheet for an MCA (Merchant Cash Advance) portfolio.

Column names: [list of columns]
Sample data (first 3 rows): [sample data]

Map each column to one of these Abacus fields:
- merchant_name: Business name
- deal_code: Unique identifier
- funded_amount: Principal amount
...

Return JSON: { "column_name": { "field": "abacus_field", "confidence": 0.95 } }
```

---

### Task 3: AI Spreadsheet Logic Analysis

**Description**: Analyze spreadsheet formulas to understand the business mechanics — how factor rates are calculated, fee structures, balance formulas. This is a key differentiator that reduces 40+ hours of manual analysis.

**Validation**:
- [ ] Detects formula columns vs static data columns
- [ ] Extracts factor rate calculation logic
- [ ] Identifies fee structures (NSF fees, late fees, origination fees)
- [ ] Understands balance calculation formulas
- [ ] Generates human-readable summary of business logic
- [ ] Stores analysis results for reference during sync

**Files**:
- `apps/api/src/rest/routers/google-sheets.ts` — Add `POST /analyze-logic` endpoint
- `packages/ai/src/spreadsheet-analysis.ts` — Logic analysis module (create)
- `packages/db/src/schema.ts` — Add `spreadsheet_logic` JSON field to connection

**Analysis Output Example**:
```json
{
  "factor_rate": {
    "formula": "=C2*1.35",
    "description": "Fixed 1.35 factor rate applied to all deals"
  },
  "nsf_fee": {
    "formula": "=IF(G2=\"NSF\", 35, 0)",
    "description": "$35 NSF fee per failed payment"
  },
  "balance": {
    "formula": "=D2-SUM(payments)",
    "description": "Payback amount minus total collected payments"
  }
}
```

---

### Task 4: Initial Deal Sync (MainSheet → mca_deals)

**Description**: Sync deal data from the connected Google Sheet to the `mca_deals` table using the configured column mappings.

**Validation**:
- [ ] Sync reads data from mapped columns
- [ ] Creates/updates records in `mca_deals` table
- [ ] Uses deal_code as unique identifier for upserts
- [ ] Handles data type conversions (strings to numbers, dates)
- [ ] Validates required fields before insert
- [ ] Logs sync results (rows synced, errors, warnings)
- [ ] Supports incremental sync (only changed rows)
- [ ] Rolls back on critical errors

**Files**:
- `packages/jobs/src/tasks/sheets-sync.ts` — Sync job implementation (create)
- `packages/db/src/queries/mca-deals.ts` — Upsert queries
- `apps/api/src/rest/routers/google-sheets.ts` — Add `POST /sync` endpoint

**Sync Job Flow**:
```
1. Fetch latest data from Google Sheet
2. Apply column mappings to transform rows
3. Validate required fields
4. Upsert to mca_deals table (match on deal_code)
5. Log sync results
6. Update last_synced_at timestamp
```

**Database Considerations**:
- Use `ON CONFLICT (deal_code, team_id) DO UPDATE` for upserts
- Track `sync_source = 'google_sheets'` for data lineage
- Store raw row data in `raw_data` JSONB column for debugging

---

### Task 5: Sync Status Indicator

**Description**: Show sync status in the dashboard header so users always know when data was last updated and if sync is in progress.

**Validation**:
- [ ] Status indicator visible in dashboard header/nav
- [ ] Shows "Last synced: X minutes ago" when idle
- [ ] Shows spinning indicator during active sync
- [ ] Shows error state with retry button if sync failed
- [ ] Clicking opens sync details drawer/modal
- [ ] Manual "Sync Now" button available

**Files**:
- `apps/dashboard/src/components/sync-status-indicator.tsx` — Status component (create)
- `apps/dashboard/src/app/[locale]/(app)/layout.tsx` — Add to header
- `apps/api/src/trpc/routers/google-sheets.ts` — Add sync status query

**Status States**:
| State | Icon | Text |
|-------|------|------|
| Idle | Check circle (green) | "Synced 5m ago" |
| Syncing | Spinner (blue) | "Syncing..." |
| Error | Warning triangle (red) | "Sync failed" |
| Never synced | Clock (gray) | "Never synced" |

---

## Exit Criteria

### Core Functionality
- [ ] User can map spreadsheet columns to MCA fields via UI
- [ ] AI suggests column mappings with 80%+ accuracy on common patterns
- [ ] AI analyzes spreadsheet formulas and explains business logic
- [ ] Deals sync from Google Sheet to database correctly
- [ ] Sync status visible in dashboard header

### Data Quality
- [ ] All required fields validated before sync
- [ ] Data types correctly converted (currency strings → numbers)
- [ ] Dates parsed correctly regardless of format
- [ ] Duplicate deals handled via upsert (no duplicates)

### Technical
- [ ] `bun build` passes without errors
- [ ] Column mappings persist across sessions
- [ ] Sync completes in < 60 seconds for 500 deals
- [ ] Error handling prevents partial/corrupt syncs

---

## Technical Notes

### Column Mapping Storage
```sql
ALTER TABLE google_sheets_connections ADD COLUMN column_mappings JSONB;
-- Example:
-- {
--   "A": { "field": "merchant_name", "confidence": 0.95 },
--   "B": { "field": "deal_code", "confidence": 0.88 },
--   ...
-- }
```

### AI Integration
- Use Claude API via existing `@midday/ai` package patterns
- Keep prompts focused and structured for consistent JSON output
- Cache analysis results to avoid redundant API calls
- Handle rate limits gracefully

### Sync Architecture
```
[Google Sheet]
    ↓ (Google Sheets API)
[Sheets Sync Job]
    ↓ (Apply mappings)
[Transform & Validate]
    ↓ (Upsert)
[mca_deals table]
```

### Reference Files
- Google Sheets API: `apps/api/src/rest/routers/google-sheets.ts`
- MCA schema: `supabase/migrations/20260125000000_add_mca_merchant_portal_tables.sql`
- Existing sync patterns: Review `packages/jobs/src/tasks/` for job structure

---

## Verification

After implementation:
1. Run `bun build` — must pass
2. Run `supabase db push` — migration applies cleanly
3. Manual test: Connect sheet → see AI suggestions → confirm mappings → sync → verify data in database
4. Check Supabase dashboard: deals appear in `mca_deals` table
5. Verify sync status indicator shows correct state
6. Test with Honest Funding's actual spreadsheet structure

---

## Customer Milestone

**Week 4 Target**: Both pilot customers synced and live

Week 2 is critical path — without column mapping and sync working, pilots can't go live. Success here means Honest Funding's 500+ deals flow into Abacus automatically.
