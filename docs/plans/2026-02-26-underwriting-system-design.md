# Underwriting System Design

**Date**: 2026-02-26
**Status**: Approved

## Overview

Add underwriting as a merchant-level process that gates deal creation. Operators upload documents (application form, bank statements, etc.), the system runs rule-based buy box checks and AI-assisted bank statement analysis, and produces a scorecard with a recommendation. The merchant detail page surfaces underwriting status via a summary card with click-through to the full dossier.

Teams that don't need underwriting can leave it disabled — zero disruption to the existing deal creation flow.

## Architecture Decision: Underwriting Before Deal Creation

Underwriting evaluates the **merchant**, not the deal. When a merchant returns for deal #2, their underwriting profile already exists. This avoids re-uploading documents and re-scoring for every deal.

When an operator clicks "New Deal" on a merchant without approved underwriting (and the team has underwriting enabled), the system redirects to the underwriting flow. On approval, the operator lands directly in the deal wizard.

## Data Model

### `underwriting_applications`

One per merchant. Reusable across deals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| merchant_id | FK → merchants | |
| team_id | FK → teams | |
| status | text | `pending_documents`, `in_review`, `scoring`, `approved`, `declined`, `review_needed` |
| requested_amount_min | numeric(12,2) | Lower end of requested range |
| requested_amount_max | numeric(12,2) | Upper end of requested range |
| use_of_funds | text | e.g., "Expansion, Working Capital" |
| fico_range | text | e.g., "600+" |
| time_in_business_months | integer | |
| broker_notes | text | Qualitative narrative from broker/operator |
| prior_mca_history | text | Default history, current positions, collections |
| decision | text | `approved`, `declined`, `review_needed` (null until decided) |
| decision_date | timestamptz | |
| decided_by | FK → users | |
| decision_notes | text | Operator notes on decision |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `underwriting_document_requirements`

Team-configurable checklist with state-based overrides.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| team_id | FK → teams | |
| name | text | e.g., "3 Months Bank Statements" |
| description | text | Instructions for operator |
| required | boolean | Required vs optional |
| applies_to_states | text[] | State codes, or empty for "all states" |
| sort_order | integer | Display order |
| created_at | timestamptz | |

**Defaults shipped with system:**
1. Application Form (all states, required)
2. 3 Months Bank Statements (all states, required)
3. Tax Returns (all states, required)

Teams can add state-specific overrides (e.g., "California Disclosure Form" for CA merchants, "6 Months Bank Statements" for NJ).

### `underwriting_documents`

Uploaded files tied to an application.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| application_id | FK → underwriting_applications | |
| team_id | FK → teams | |
| requirement_id | FK → underwriting_document_requirements | Nullable (for extra docs) |
| file_path | text | Supabase Storage path |
| file_name | text | Original filename |
| file_size | integer | Bytes |
| document_type | text | e.g., "bank_statement", "application", "tax_return" |
| processing_status | text | `pending`, `processing`, `completed`, `failed` |
| extraction_results | jsonb | AI-extracted data (month-by-month analysis, etc.) |
| waived | boolean | Operator marked as waived |
| waive_reason | text | Why it was waived |
| uploaded_at | timestamptz | |

### `underwriting_scores`

AI + rule-based scorecard tied to an application.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| application_id | FK → underwriting_applications | |
| team_id | FK → teams | |
| recommendation | text | `approve`, `decline`, `review_needed` |
| confidence | text | `high`, `medium`, `low` |
| buy_box_results | jsonb | Array of {criterion, passed, actual_value, required_value} |
| bank_analysis | jsonb | Array of {month, deposits, pay_burden, holdback_pct, date_range} |
| extracted_metrics | jsonb | {avg_daily_balance, monthly_avg_revenue, nsf_count, deposit_consistency} |
| risk_flags | jsonb | Array of {flag, severity, description} |
| prior_mca_flags | jsonb | Array of {funder, status, details} |
| ai_narrative | text | 2-3 sentence AI summary |
| scored_at | timestamptz | |

## Underwriting Flow (UI)

Three-step process at `/merchants/[id]/underwriting/new`.

### Step 1: Merchant Profile

- Pre-filled from existing merchant data (name, industry, state)
- Operator adds: requested amount range, use of funds, FICO range, time in business
- Broker notes / backstory textarea (the qualitative narrative)
- Prior MCA history section (existing positions, defaults, collections)

### Step 2: Document Upload

- Dynamic checklist based on merchant's state + team configuration
- Drag-and-drop PDF upload per requirement
- Progress indicators: uploaded / missing / processing
- AI extraction starts immediately on upload
- Operator can mark optional docs as "waived" with reason

### Step 3: Review & Decision

- **Left side**: Merchant dossier — profile summary, broker narrative, prior history
- **Right side**: AI scorecard — buy box checklist (pass/fail), bank analysis table (monthly deposits, pay burden, holdback %), risk flags, recommendation with confidence and narrative
- Operator can override AI recommendation
- Final action: Approve / Decline / Request More Info
- On approval: "Create Deal" button → straight to deal wizard

## Merchant Detail Page — Underwriting Summary Card

Sits alongside existing stats cards (Active Deals, Total Outstanding, etc.).

**When underwriting exists:**
- Status badge (Approved/Declined/In Review/Pending Docs)
- Decision date
- AI recommendation + confidence
- Key metrics: monthly avg deposits, holdback %, FICO range
- "View Full Underwriting" link → opens complete dossier

**When no underwriting exists:**
- Empty state: "No underwriting on file"
- "Start Underwriting" CTA button

## AI Scoring Engine

### Layer 1: Rule-Based (Buy Box Check)

Runs instantly against the team's `underwriting_buy_box` criteria:
- Min monthly revenue
- Min time in business
- Max existing positions
- Max NSF count
- Excluded industries
- Min credit score

Any hard fail = auto-flag for review. Operator can override.

### Layer 2: AI-Assisted (Claude Analysis)

Triggered after documents finish processing:
- **Bank statement extraction**: Parse PDFs → month-by-month deposits, NSFs, avg daily balance, deposit consistency
- **Pay burden calculation**: Given requested amount range, calculate weekly/monthly payment and holdback % per month
- **Risk narrative**: Read broker notes + extracted data → 2-3 sentence summary with recommendation
- **Confidence scoring**: High (clear decision), Medium (some concerns), Low (conflicting signals)
- **Prior MCA detection**: Flag stacking risk from bank statement patterns

### Example Scorecard Output

```
Recommendation: APPROVE | Confidence: HIGH

Buy Box: 5/6 PASS
  ✓ Monthly revenue ≥ $10K — $83K-$191K
  ✓ Time in business ≥ 12mo — 12 years
  ✓ Max NSF ≤ 3 — 0 found
  ✓ Industry not excluded — Construction ✓
  ✓ Credit score ≥ 500 — 600+
  ✗ Max existing positions ≤ 2 — 1 active (Ondeck collections)

Bank Analysis:
  Oct: $191,567 | $4,432/mo | HB 2.3%
  Nov: $78,027  | $4,432/mo | HB 5.7%
  Dec: $83,434  | $4,432/mo | HB 5.3%

Risk Flags:
  ⚠ Prior default (Ondeck) — currently in collections
  ⚠ Revenue volatility — Oct was 2.3x Nov/Dec

AI Summary:
  "Merchant shows strong but seasonal revenue in construction.
   Prior Ondeck default explained by one-time staffing issue,
   currently making collections payments. Holdback stays under
   6% even in low months. Recommend approval at lower end of
   requested range ($45K)."
```

## Team Configuration (Settings)

New "Underwriting" section in team settings:

### Underwriting Toggle
- Team-level on/off switch
- Off: "New Deal" goes straight to deal wizard (current behavior)
- On: "New Deal" checks for approved underwriting first

### Document Requirements
- Manage the checklist: add/remove/reorder requirements
- Each requirement: name, description, required/optional, state overrides
- State overrides inherit base requirements and add/modify on top

### Buy Box Criteria
- Settings UI for the existing `underwriting_buy_box` table
- Min revenue, TIB, max positions, max NSF, excluded industries, min credit score

## Integration with Deal Wizard

- When underwriting is enabled and operator clicks "New Deal":
  - If merchant has approved underwriting → proceed to deal wizard
  - If merchant has no underwriting or declined → redirect to underwriting flow with message
  - If merchant has underwriting in progress → show status and link to continue
- When underwriting is disabled → deal wizard works exactly as today
- Deal record stores `underwriting_application_id` FK for audit trail
