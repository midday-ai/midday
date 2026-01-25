# Abacus 5-Month Launch Roadmap

## Executive Summary
**Timeline:** 20 weeks (20 one-week sprints)
**Team:** Solo developer + Claude Code AI assistance
**Goal:** 15 customers live, merchant portal + collections workflow operational
**Launch Date:** ~June 2026

---

## Strategic Decisions

### 1. Defer Namespace Migration (Sprint 6, not Sprint 1)
The `@midday/*` → `@abacus/*` rename affects 956 files but does NOT block customer-facing features. Doing it early creates merge conflicts with all feature branches. Do it during a stabilization sprint after core features work.

### 2. Google Sheets Sync FIRST (Sprint 1)
Without data, the portal is an empty shell. The sync is the "wedge" that proves value proposition. Pilot customers already have spreadsheets - sync them immediately.

### 3. What's Already Built (Don't Redo)
- MCA database schema (mca_deals, mca_payments tables) - migration ready
- Merchant portal UI (McaPortalContent.tsx) - basic working version
- MCA deal/payment queries - CRUD operations exist
- Merchant portal tRPC router - API foundation
- Team branding support

---

## 20-Week Sprint Roadmap (1-Week Sprints)

---

## PHASE 1: DATA FOUNDATION (Weeks 1-4)

### Week 1: "Google Sheets Connection"
**Goal:** Connect a Google Sheet to Abacus and read data.

**Deliverables:**
- Google Sheets OAuth flow in dashboard settings
- Sheet URL input and validation
- Read sheet metadata (columns, row count)
- Store connection in `sheet_connections` table

**Exit Criteria:** Can connect Honest Funding's sheet and see column names

**Key Files:** `packages/jobs/src/tasks/sheets-sync.ts` (new)

---

### Week 2: "Column Mapping & Initial Sync"
**Goal:** Map spreadsheet columns to MCA fields and sync deals.

**Deliverables:**
- Column mapping configuration UI
- AI-suggested column mapping (Claude)
- **AI spreadsheet logic analysis** (auto-detect formulas, fee structures, factor rate calculations, business mechanics) - reduces 40+ hour manual mapping to minutes
- Initial sync: MainSheet → mca_deals table
- Sync status indicator in header

**Technology:** Leverages Claude API and Claude for Sheets for intelligent spreadsheet analysis that understands not just column names, but the underlying business logic (factor rates, fee structures, balance calculations).

**Exit Criteria:** Honest Funding's deals appear in database with correct field mapping

---

### Week 3: "Payment Sync & Ledger"
**Goal:** Sync payment data and calculate balances.

**Deliverables:**
- Sync PMT sheet → mca_payments table
- Ledger balance calculation (running balance)
- NSF fee logic ($35 per failed payment)
- Paid percentage calculation

**Exit Criteria:** Payment history syncs, balances match spreadsheet formulas

---

### Week 4: "Sync Reliability & Pilot Go-Live"
**Goal:** Honest Funding and Emmy Capital running on Abacus.

**Deliverables:**
- Sync lock mechanism (prevent concurrent syncs)
- Payment-only fast sync option
- Email notification on sync failure
- Manual sync trigger button
- Emmy Capital sheet connected

**Exit Criteria:** Both pilots synced, merchants can access portal with accurate data

---

## PHASE 2: ADMIN EXPERIENCE (Weeks 5-8)

### Week 5: "Admin Dashboard - Portfolio Overview"
**Goal:** Operators see portfolio summary at a glance.

**Deliverables:**
- Admin dashboard route (`/portfolio/`)
- Summary cards (total funded, outstanding, repaid %)
- At-risk count indicator
- Navigation menu update

**Exit Criteria:** Dashboard shows accurate portfolio stats from synced data

---

### Week 6: "Admin Dashboard - Deal Management"
**Goal:** Operators can browse and search all deals.

**Deliverables:**
- MCA deals table with sorting/filtering
- Search by merchant name, deal code
- Status filters (active, paid off, defaulted)
- Basic risk indicators (NSF count badge)

**Exit Criteria:** Can find any deal in < 5 seconds

---

### Week 7: "Deal Detail View"
**Goal:** Drill into any deal and see full history.

**Deliverables:**
- Deal detail page (`/portfolio/[dealId]`)
- Payment history timeline
- Days past due calculation
- Merchant impersonation button ("View as Merchant")

**Exit Criteria:** Can see complete payment history for any deal

---

### Week 8: "Onboarding Wizard & Customer #3"
**Goal:** New customer can self-onboard and first referral goes live.

**Deliverables:**
- First-time setup wizard (connect sheet → map columns → sync)
- Onboarding progress indicator
- Welcome email with portal links
- Reach out to 3-5 referral prospects

**Exit Criteria:** One new customer (beyond pilots) successfully onboards

---

## PHASE 3: COLLECTIONS & STICKINESS (Weeks 9-12)

### Week 9: "Collections Dashboard"
**Goal:** Collections view showing at-risk deals prioritized.

**Deliverables:**
- Collections route (`/collections/`)
- At-risk deals list (sorted by severity)
- Days past due column
- NSF count column

**Exit Criteria:** Collections team can see prioritized work queue

---

### Week 10: "Risk Levels & Assignment"
**Goal:** Categorize and assign deals to collectors.

**Deliverables:**
- Risk level field (Low/Medium/High/Critical)
- Risk level assignment dropdown
- Assignee field (who owns this deal)
- Filter by assignee
- `collections_deal_meta` table

**Exit Criteria:** Deals can be categorized and assigned to team members

---

### Week 11: "Notes & Follow-ups"
**Goal:** Log collection activities and schedule next actions.

**Deliverables:**
- Notes drawer (slide-out panel)
- Add note with timestamp
- Note history timeline
- Follow-up date picker
- `collections_notes` table

**Exit Criteria:** Can log "Called merchant, left voicemail, follow up Friday"

---

### Week 12: "Collections Polish & Customer #5"
**Goal:** Collections workflow complete, 5 customers target.

**Deliverables:**
- Collections dashboard refinements
- Risk level visible in admin dashboard
- Quick actions (call, email, note)
- Push for customers 4 and 5

**Exit Criteria:** 5 customers using platform, collections workflow daily-drivable

---

## PHASE 4: LETTER GENERATION (Weeks 13-14)

### Week 13: "Payoff Letter Generation"
**Goal:** Generate payoff letters as PDF.

**Deliverables:**
- Payoff letter template (React-PDF)
- Letter generation API endpoint
- PDF preview in modal
- Download button

**Exit Criteria:** Can generate branded payoff letter in < 5 seconds

---

### Week 14: "Letter Suite & Merchant Requests"
**Goal:** Full letter suite and merchant self-service.

**Deliverables:**
- Zero balance confirmation letter
- Payoff discount calculator modal
- Renewal letter template
- Merchant can request payoff letter from portal
- Pay run PDF (payment history statement)

**Exit Criteria:** Merchants requesting letters, operators approving/generating

---

## PHASE 5: ACCESS CONTROL & CLEANUP (Weeks 15-16)

### Week 15: "Role-Based Access Control"
**Goal:** Different views for admins, reps, and merchants.

**Deliverables:**
- Role enum (ADMIN/REP/MERCHANT)
- Admin email domain check (auto-admin for @company.com)
- Rep portal (filtered to assigned deals only)
- Navigation changes based on role

**Exit Criteria:** Reps see only their deals, merchants see only their portal

---

### Week 16: "Namespace Migration"
**Goal:** Clean up @midday/* → @abacus/* technical debt.

**Deliverables:**
- Rename all @midday/* imports (956 files)
- Update package.json names
- Environment variable rename (MIDDAY_* → ABACUS_*)
- Email template branding updates
- Full build verification

**Exit Criteria:** `bun build` passes, all imports use @abacus/*

---

## PHASE 6: ALERTS & INTELLIGENCE (Weeks 17-18)

### Week 17: "Push Notifications"
**Goal:** Proactive alerts for key events.

**Deliverables:**
- NSF alert (email when NSF detected during sync)
- Late payment alert (configurable threshold)
- Notification preferences UI
- Email templates for alerts

**Exit Criteria:** Operators receive NSF email within 5 minutes of sync

---

### Week 18: "Weekly Summary & AI Insights"
**Goal:** Weekly portfolio digest and AI-powered summaries.

**Deliverables:**
- Weekly portfolio summary email (Monday morning)
- AI note summarization (Claude-powered deal summary)
- "Merchants need attention" bundled alert
- Risk score calculation algorithm

**Exit Criteria:** Weekly email received with accurate portfolio stats

---

## PHASE 7: LAUNCH READINESS (Weeks 19-20)

### Week 19: "Polish & Performance"
**Goal:** Production-ready UX and performance.

**Deliverables:**
- Dashboard loads < 2 seconds
- Mobile-responsive improvements
- Almost finished table (90-100% paid deals)
- Upcoming renewals table (50-90% paid)
- Error monitoring tuning (Sentry)

**Exit Criteria:** Dashboard fast, mobile works, no console errors

---

### Week 20: "Launch Week"
**Goal:** 12-15 customers, revenue flowing.

**Deliverables:**
- Billing integration (Stripe subscription enforcement)
- Referral flow (easy invite for new customers)
- Security audit (RLS policies review)
- Onboarding docs / help guides
- Customer success outreach

**Exit Criteria:** 12-15 customers, $5-7.5K MRR, no critical bugs

---

## Customer & Revenue Milestones

| Week | Phase | Customers | MRR Target | Milestone |
|------|-------|-----------|------------|-----------|
| 4 | Data Foundation | 2 (pilots) | $0 | Both pilots synced |
| 8 | Admin Experience | 3-4 | $1,500 | First referral customer |
| 12 | Collections | 5-7 | $3,000 | Collections workflow live |
| 14 | Letters | 7-9 | $4,000 | Letter generation live |
| 16 | Access Control | 9-11 | $5,000 | Namespace migration done |
| 18 | Alerts | 10-12 | $6,000 | Weekly summaries sending |
| 20 | Launch | 12-15 | $7,500 | Full launch complete |

---

## Weekly Actionable Format

When asking "What do we do this week?", I'll give you the specific week's tasks:

**Example - Week 1 Tasks:**
1. Set up Google Sheets OAuth flow in dashboard settings
2. Create `sheet_connections` table migration
3. Build sheet URL input component
4. Implement sheet metadata fetching (columns, row count)
5. Test with Honest Funding's sheet URL

**How to use this roadmap:**
- Ask: "Roadmap, what's the focus for Week 5?"
- I'll respond with that week's deliverables and exit criteria
- Each week builds on the previous, so follow in order

---

## Critical File Locations

| Purpose | Path |
|---------|------|
| Sync jobs | `packages/jobs/src/tasks/` |
| MCA queries | `packages/db/src/queries/mca-deals.ts` |
| Merchant portal API | `apps/api/src/trpc/routers/merchant-portal.ts` |
| MCA schema migration | `supabase/migrations/20260125000000_add_mca_merchant_portal_tables.sql` |
| Merchant portal UI | `apps/dashboard/src/app/[locale]/(public)/p/[portalId]/mca-portal-content.tsx` |
| Admin dashboard | `apps/dashboard/src/app/[locale]/(app)/(sidebar)/` |

---

## Verification & Testing

**Per Sprint:**
1. Run `bun build` - TypeScript compiles without errors
2. Run `bun test` - All tests pass
3. Manual demo of sprint goal
4. Deploy to staging (Vercel preview)
5. Pilot customer feedback session

**End-to-End Launch Verification:**
1. New customer connects Google Sheet
2. Data syncs within 60 seconds
3. Merchant receives portal invite email
4. Merchant logs in and sees accurate balance
5. Operator sees portfolio dashboard
6. NSF triggers alert notification
7. Payoff letter generates correctly

---

## Dependencies & Risks

**Critical Path:**
```
Sheets Sync (S1) → Pilot Migration (S2) → Admin Dashboard (S3) → Collections (S4)
```

**Highest Risks:**
1. **Google Sheets sync complexity** - Reference Honest Funding's 2,800 LOC implementation
2. **Balance calculation accuracy** - Must match spreadsheet formulas exactly
3. **Namespace migration conflicts** - Do in single branch, coordinate timing
4. **PDF generation on Vercel** - May hit 30s timeout, evaluate alternatives

---

## Solo + AI Work Patterns

| Phase | Focus | AI Assist Best For |
|-------|-------|-------------------|
| Weeks 1-4 | Backend-heavy | Sync logic, DB queries, API routes |
| Weeks 5-8 | Balanced | UI components, data tables, forms |
| Weeks 9-12 | Feature-heavy | Collections workflow, state management |
| Weeks 13-16 | Mixed | PDFs, auth, codebase cleanup |
| Weeks 17-20 | Polish | Email templates, testing, docs |

**Estimated Weekly Velocity:** 15-25 hours focused work + AI assistance
