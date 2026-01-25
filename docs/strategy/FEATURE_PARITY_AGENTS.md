# Feature Parity Agent Prompts (17-28)

These are the enhanced agent prompts ready to execute. Run Agent 17 first, then 18, then 19 sequentially. After that, run Agents 20-28 in parallel.

**Output Location**: All agents append to `docs/FEATURE_PARITY.md`

---

## AGENT 17: Honest Funding Feature Extraction

```
You are the lead feature extraction agent analyzing C:\Users\stwee\dev\honest-funding to create a comprehensive feature inventory for Abacus migration.

STRATEGIC CONTEXT:
- Abacus is the "operating system for MCA businesses" - not just a loan tracker
- Philosophy: "Push, Don't Pull" - features should proactively surface information
- Target: 5-minute time-to-value for new customers
- Architecture: Multi-tenant, configuration-driven (no per-customer code)

KNOWN DATA MODELS (from prisma/schema.prisma):
- Borrower: business_name, contact info, linked user, borrower_code
- Loan: 100+ fields including principal, payback, factor, NSF counts, status, funder_rep, lifecycle_stage
- Payment: amount, date, status, method, category, running balance
- User: role (borrower/admin/rep), access_revoked, linked_funder_reps
- SyncLog: sync tracking with error details

SUB-AGENT STRATEGY - You MUST spawn up to 3 sub-agents:

Sub-Agent A: Frontend Analysis
- Analyze src/app/ - all pages, their functionality, user flows
- Document authentication flows (borrower vs admin vs rep)
- Map component hierarchy in src/components/

Sub-Agent B: Backend Analysis
- Analyze src/app/api/ - all API endpoints
- Document src/lib/ utilities and business logic
- Map data transformations and calculations

Sub-Agent C: Data & Integration Analysis
- Deep-dive prisma/schema.prisma - document all field semantics
- Analyze email-templates/ - email types and triggers
- Document Google Sheets sync logic in src/lib/*sync*

YOUR TASK: Create a comprehensive feature inventory as the source of truth for Abacus feature parity.

For each feature, document:
1. Feature Name - Clear, descriptive name
2. Category - Dashboard | Portal | Collections | Admin | Sync | Reporting | Communications
3. Phase Alignment - Which Abacus phase? (1=Wedge, 2=Stickiness, 3=Payments, 4=Underwriting)
4. Priority - P0 (launch blocker) | P1 (must-have) | P2 (nice-to-have)
5. Description - What it does, user value
6. Key Files - Source files implementing this feature
7. Data Requirements - Database tables/fields needed
8. Push Opportunity - How could this feature proactively notify users?
9. Multi-Tenant Considerations - What needs to be configurable per customer?

OUTPUT: Create docs/FEATURE_PARITY.md with Executive Summary, Feature Inventory by Category, Data Model Requirements, User Roles & Permissions Matrix, and Push Notification Opportunities.

QUALITY CHECKLIST:
- All src/app/ pages documented
- All API endpoints catalogued
- All Prisma models with field-level detail
- All email templates mapped to triggers
- Each feature has phase alignment and priority
- Multi-tenant considerations noted
- Push opportunities identified
```

---

## AGENT 18: Emmy Capital Delta Analysis

```
You are analyzing C:\Users\stwee\dev\emmy-capital to identify features that differ from Honest Funding.

KNOWN DIFFERENCES:
- Emmy Capital is MISSING: /rep page, /admin/adoption page
- Emmy Capital ADDS: Enhanced collections with AI summaries, document management, PDF letter generation

STRATEGIC CONTEXT:
- Features in Emmy but not Honest may be more mature implementations
- Features in Honest but not Emmy indicate optional/customer-specific needs
- AI-powered features align with Abacus's AI-native philosophy
- AI features use multi-provider strategy (Claude default for reasoning, Gemini for embeddings, configurable)

SUB-AGENT STRATEGY - Spawn up to 2 sub-agents:

Sub-Agent A: Feature Comparison
- Compare src/app/ pages between Emmy and Honest
- Compare src/components/ - identify unique components
- Compare API routes

Sub-Agent B: Advanced Features
- Document AI integration (generate-ai-summary.ts) - NOTE: Uses Gemini, will add to multi-provider options
- Document document management system
- Document PDF letter generation
- Document collections enhancements

YOUR TASK: Document features that differ from Honest Funding with clear recommendations.

For each delta, document:
1. Feature - Name and location
2. In Emmy - Yes/No/Enhanced
3. In Honest - Yes/No/Basic
4. Recommendation - Adopt from Emmy | Adopt from Honest | Build new | Skip
5. Rationale - Why this recommendation?
6. Abacus Enhancement - How should Abacus improve on this? (especially AI with Claude)

OUTPUT: APPEND to docs/FEATURE_PARITY.md a section called "Emmy Capital Deltas"
```

---

## AGENT 19: Abacus Gap Analysis

```
You have access to:
- C:\Users\stwee\dev\abacus (the new platform)
- docs/FEATURE_PARITY.md (created by Agents 17-18)

STRATEGIC CONTEXT:
- Abacus is forked from Midday (freelancer platform)
- Core transformation: customers→merchants, invoices→MCAs
- Database: Supabase with RLS (Row Level Security)
- Architecture: Next.js App Router, tRPC + REST APIs

KNOWN ABACUS STATUS (from MIGRATION_MASTER.md):
- Branding migration: COMPLETE
- Database schema: EXISTS but uses Midday terminology
- 956 files still use @midday/* imports
- Domain model transformation: NOT STARTED

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Frontend Gaps
- Compare apps/dashboard/src/app/ to Honest Funding pages
- Identify missing routes, components, user flows
- Document existing components that can be repurposed

Sub-Agent B: Backend Gaps
- Compare packages/supabase/ schema to Prisma schema
- Identify missing tables, fields, relationships
- Document API gaps in apps/api/

Sub-Agent C: Infrastructure Gaps
- Compare email templates in packages/email/
- Compare sync mechanisms
- Document integration gaps (Google Sheets, etc.)

YOUR TASK: For EACH feature in FEATURE_PARITY.md, determine implementation status.

Status Categories:
- COMPLETE - Feature exists and works
- PARTIAL - Feature exists but incomplete (document what's missing)
- TRANSFORMABLE - Midday feature can be repurposed (document transformation needed)
- NOT STARTED - Must be built from scratch (estimate complexity: S/M/L/XL)

OUTPUT: APPEND to docs/FEATURE_PARITY.md with Gap Summary, Gap Matrix, Critical Path (P0 Features), Quick Wins, and Technical Debt to Address.
```

---

## AGENT 20: Merchant Portal & Access Control

```
The Merchant Portal is the "$50K feature" - a CRITICAL differentiator that creates massive lock-in.

STRATEGIC IMPORTANCE:
- Would cost small MCAs $30K-$50K to build custom
- Creates switching costs: merchants bookmark it, set up auto-pay
- Professionalization: Makes small MCA look like a bank

SOURCE ANALYSIS:
- Honest Funding: /dashboard (borrower view), /merchant-view (admin impersonation)
- Access control: /access, /access-denied, /access-revoked, /register, /login/first-time

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Merchant Experience
- Document complete merchant journey from invite to daily use
- Analyze /dashboard for borrowers - all features available
- Document what merchants can see vs. what's hidden
- Identify self-service capabilities

Sub-Agent B: Access Control System
- Document invitation flow (how merchants get access)
- Document authentication (separate from admin auth)
- Document access revocation (who can revoke, what happens)
- Document first-time login experience
- Analyze User model fields: access_revoked, access_revoked_at

Sub-Agent C: Admin Impersonation
- Document /merchant-view functionality
- How does admin select a merchant?
- What can admin do in impersonation mode?
- Security considerations (audit trail?)

KEY QUESTIONS TO ANSWER:
1. What is the complete merchant journey (invite → first login → daily use → payoff)?
2. How is access granted, managed, and revoked?
3. What data is visible to merchants vs. hidden?
4. How does the portal handle multiple loans per merchant?
5. What happens when a merchant has a defaulted loan?
6. How does branding work (logo, colors, company name)?

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Merchant Portal Specification" with User Journey, Features, Access Control Matrix, Multi-Tenant Customization, and Security Requirements.
```

---

## AGENT 21: Collections & Risk Management

```
Collections is CRITICAL for MCA operators - it's how they recover funds and manage portfolio risk.

STRATEGIC CONTEXT:
- Collections is Phase 2 (Stickiness) - makes operators dependent on Abacus
- "Push, Don't Pull" - Collections should proactively alert about at-risk merchants
- AI integration opportunity: Auto-prioritize queue, suggest next action using configurable AI provider (Claude recommended)

SOURCE ANALYSIS:
- /collections page in both Honest and Emmy
- Emmy Capital has enhanced collections with AI summaries
- Risk fields: nsf_7d_count, total_nsf_count, late_count_7d, late_count_total, days_past_due

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Collections Workflow
- Document /collections page functionality
- Document deal assignment (who handles which merchant)
- Document notes system (activity type, channel, outcome)
- Document follow-up scheduling and tracking

Sub-Agent B: Risk Scoring
- Document all risk-related fields in Loan model
- How is risk calculated? (nsf_7d_count, late_count, days_past_due)
- How is risk displayed? (badges, colors, priority)
- Document collections queue prioritization

Sub-Agent C: Automation & AI
- Document AI summary generation (Emmy Capital uses Gemini - add to multi-provider options)
- Identify automation opportunities
- Document status/status_detail field usage
- Document lifecycle_stage transitions

KEY QUESTIONS TO ANSWER:
1. How is the collections queue prioritized?
2. What actions can collections agents take?
3. How are notes and follow-ups tracked?
4. What triggers risk level changes?
5. What should trigger proactive alerts? (NSF, late payment, status change)
6. How can Claude AI assist collections? (auto-summaries, suggested actions)

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Collections & Risk Management Specification" with Risk Scoring Model, Risk Levels, Collections Workflow, Collections Actions, Push Notifications, and AI Integration (Claude-Powered).
```

---

## AGENT 22: Google Sheets Sync & Data Pipeline

```
Google Sheets sync is the CORE of Abacus's value proposition: "Connect your Google Sheet and get a professional dashboard in 5 minutes."

STRATEGIC CONTEXT:
- "Meet Them Where They Are" - operators already use spreadsheets
- AI-powered column mapping using Claude - no manual configuration
- Bi-directional sync (future) - update sheet from Abacus
- Phase 1 (Wedge) feature - this is how we get customers

SOURCE ANALYSIS:
- Honest Funding: src/lib/sync.ts (141 KB in Emmy Capital)
- SyncLog model tracks all sync operations
- Dual representation: sheet_* (original) and *_num (parsed)

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Sync Mechanics
- Document src/lib/sync.ts in detail
- Document src/lib/googleSheets.ts
- How is auth handled? (service account)
- What triggers a sync? (manual, scheduled, webhook)

Sub-Agent B: Data Transformation
- How are sheet columns mapped to database fields?
- How are values parsed? (currency, dates, percentages)
- How are errors handled?
- How is the sheet_* vs *_num pattern used?

Sub-Agent C: Sync Operations
- Document SyncLog model usage
- How is sync locking implemented? (src/lib/sync-lock.ts)
- What changes are tracked?
- How are sync errors reported?

KEY QUESTIONS TO ANSWER:
1. What is the complete sync flow (auth → read → transform → upsert → log)?
2. How does column mapping work? (currently manual or AI-detected?)
3. What happens when sync fails?
4. How is data conflict resolved?
5. What should trigger a sync? (on-demand, scheduled, real-time)
6. How can Claude AI improve column detection and data validation?

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Google Sheets Sync Specification" with Sync Architecture, Data Models Synced, Column Mapping, Error Handling, and Abacus Enhancements (Claude-Powered).
```

---

## AGENT 23: Admin Dashboard & User Management

```
The Admin Dashboard is the primary interface for MCA operators. It must provide comprehensive portfolio visibility with minimal effort ("Push, Don't Pull").

SOURCE ANALYSIS:
- /admin in Honest Funding
- /admin/adoption for adoption tracking (Honest only)
- User CRUD, role management, team settings

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Dashboard Features
- Document /admin page layout and components
- Document all metrics displayed (portfolio summary, delinquency buckets)
- Document filtering, sorting, search capabilities
- Document data refresh mechanisms

Sub-Agent B: User Management
- Document user CRUD operations
- Document role assignment (admin, rep, borrower)
- Document team invitation flow
- Document user deactivation

Sub-Agent C: Settings & Configuration
- Document any org-level settings
- Document /admin/adoption functionality
- Document sync controls and logs
- Document system health indicators

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Admin Dashboard Specification" with Dashboard Sections, Key Metrics, Smart Lists, User Management, and Push Opportunities.
```

---

## AGENT 24: Rep Portal & Multi-Role Views

```
The Rep Portal (/rep) provides funder representatives with a filtered view of their deals. Unique to Honest Funding (not in Emmy Capital).

STRATEGIC CONTEXT:
- Funder reps need visibility into their originated deals
- Access must be scoped (can't see other reps' deals)
- May need ISOs/Brokers in the future (similar pattern)

SUB-AGENT STRATEGY - Spawn 2 sub-agents:

Sub-Agent A: Rep Experience
- Document /rep page functionality
- What data do reps see?
- What actions can reps take?
- How is rep-to-loan association managed? (funder_rep field, linked_funder_reps array)

Sub-Agent B: Access Scoping
- How does filtering work?
- What's the difference between rep and admin views?
- Document the User.linked_funder_reps field usage

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Rep Portal Specification" with Role Comparison, Rep Data Scoping, and Future: ISO/Broker Portal considerations.
```

---

## AGENT 25: Reporting, Analytics & Export

```
This agent consolidates reporting/analytics with payment history/ledger into unified data visualization and export capabilities.

STRATEGIC CONTEXT:
- MCA operators report to funders regularly
- Professional exports (PDF, CSV) are table stakes
- "Push, Don't Pull" - reports should be auto-generated and delivered

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Dashboard Analytics
- Document all charts and visualizations
- Document delinquency buckets and categorization
- Document performance tracking over time

Sub-Agent B: Payment Ledger
- Document payment display components
- How are payments categorized? (ACH, NSF, adjustment, fee)
- How is running balance calculated?
- Document balance burndown visualization

Sub-Agent C: Export & Reports
- Document PDF export (pay-run-pdf, ledger export)
- Document CSV export capabilities
- Document any automated report generation
- Document branding in exports

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Reporting & Analytics Specification" with Dashboard Visualizations, Payment Ledger Features, Export Capabilities, and Automated Reports (Push).
```

---

## AGENT 26: Email Communications & Notifications

```
Email is a primary channel for the "Push, Don't Pull" philosophy. Both transactional and proactive communications are critical.

SOURCE ANALYSIS:
- email-templates/ in Honest Funding
- 5 templates: confirm-signup, invite-user, magic-link, reset-password, change-email

SUB-AGENT STRATEGY - Spawn 2 sub-agents:

Sub-Agent A: Transactional Emails
- Document all email templates
- Document trigger conditions
- Document email content and branding

Sub-Agent B: Notification Strategy
- Identify all events that should trigger emails
- Document who receives each notification
- Document email frequency management (digest vs. instant)

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Email Communications Specification" with Transactional Emails, Proactive Notifications (NEW for Abacus), Email Branding, and Notification Preferences.
```

---

## AGENT 27: Payments & Banking Integration (Phase 3)

```
This agent explores Phase 3 capabilities: payment processing through the merchant portal and bank account connections. These features don't exist in Honest Funding yet but are critical to Abacus's roadmap.

STRATEGIC CONTEXT:
- Phase 3 (2026 H1) features per PRODUCT_VISION.md
- Payment processing through portal creates strongest lock-in
- Bank connections via Plaid enable auto-reconciliation
- This is where Abacus becomes indispensable

TARGET CAPABILITIES:
- ACH payment collection through merchant portal
- Plaid bank account verification
- Automated payment reconciliation
- Payment scheduling and reminders

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Payment Processing Research
- Research payment processors suitable for MCA (Stripe ACH, Dwolla, etc.)
- Document compliance requirements (NACHA, money transmission)
- Research payment scheduling patterns
- Document refund/chargeback handling

Sub-Agent B: Banking Integration Research
- Research Plaid integration patterns
- Document bank account verification flows
- Research balance checking capabilities
- Document real-time payment detection

Sub-Agent C: Abacus Current State
- Check existing Abacus payment infrastructure (Stripe integration from Midday)
- Document what can be repurposed vs. built new
- Check packages/supabase/ for payment-related tables
- Review Trigger.dev jobs for payment automation opportunities

KEY QUESTIONS TO ANSWER:
1. What payment methods should be supported? (ACH, card, wire)
2. How do merchants authorize recurring payments?
3. How is payment failure handled?
4. How does reconciliation work?
5. What compliance requirements apply?
6. How can Claude AI assist? (payment anomaly detection, reconciliation matching)

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Payments & Banking Specification (Phase 3)" with Payment Collection Methods, Merchant Payment Portal, Bank Account Verification Flow, Automated Reconciliation, Push Notifications, Compliance Requirements, and AI Integration (Claude).
```

---

## AGENT 28: Underwriting & Origination (Phase 4)

```
This agent explores Phase 4 capabilities: AI-powered underwriting and deal origination. These are future features that will transform Abacus from a servicing platform to a full-stack lending OS.

STRATEGIC CONTEXT:
- Phase 4 (2026 H2) features per PRODUCT_VISION.md
- AI underwriting using Claude is the ultimate differentiator
- Document extraction eliminates manual data entry
- Stacking detection protects funders

TARGET CAPABILITIES:
- AI-powered credit analysis using Claude
- Bank statement document extraction
- Stacking detection across MCA databases
- Deal scoring and recommendations
- ISO/Broker deal submission portal

SUB-AGENT STRATEGY - Spawn 3 sub-agents:

Sub-Agent A: Underwriting Research
- Research MCA underwriting criteria (bank balance, revenue, time in business)
- Document typical approval factors and weights
- Research credit scoring approaches
- Document risk indicators specific to MCA

Sub-Agent B: Document Processing Research
- Research bank statement extraction (OCR, PDF parsing)
- Document required data points (deposits, withdrawals, balances, NSFs)
- Research statement verification (fraud detection)
- Explore Claude's document analysis capabilities

Sub-Agent C: Industry Integration Research
- Research stacking databases (Clarifi, LexisNexis)
- Document ISO/Broker portal patterns
- Research deal submission workflows
- Document commission tracking requirements

KEY QUESTIONS TO ANSWER:
1. What data is needed for MCA underwriting?
2. How are bank statements processed?
3. How is stacking detected?
4. What is the ISO/Broker workflow?
5. How can Claude AI power underwriting decisions?
6. What integrations are required?

OUTPUT: APPEND to docs/FEATURE_PARITY.md "Underwriting & Origination Specification (Phase 4)" with MCA Underwriting Criteria, Bank Statement Processing, Data Points Extracted, Stacking Detection, AI-Powered Underwriting, ISO/Broker Portal, Deal Submission Workflow, Integration Requirements, and Push Notifications.
```

---

## Execution Order

```
PHASE 1: FOUNDATION (Sequential)
1. Run Agent 17 → Creates docs/FEATURE_PARITY.md
2. Run Agent 18 → Appends Emmy Capital Deltas
3. Run Agent 19 → Appends Gap Analysis

PHASE 2: FEATURE SPECS (Parallel - run all at once)
- Agent 20: Merchant Portal
- Agent 21: Collections & Risk
- Agent 22: Google Sheets Sync
- Agent 23: Admin Dashboard
- Agent 24: Rep Portal
- Agent 25: Reporting & Analytics
- Agent 26: Email Communications

PHASE 3: FUTURE PLANNING (Parallel with Phase 2)
- Agent 27: Payments & Banking (Phase 3 research)
- Agent 28: Underwriting & Origination (Phase 4 research)
```

---

## Key Reminders

1. **Multi-Provider AI with Claude Default**: Use Claude as default for reasoning tasks, with flexibility to use alternatives:
   - **Recommended defaults**: Claude (sonnet for most tasks, haiku for fast summaries, opus for complex analysis)
   - **Embeddings**: Google Gemini (Claude doesn't offer embeddings)
   - **Fallback**: OpenAI (gpt-4o, gpt-4o-mini) when needed
   - Provider selection should be CONFIGURABLE via environment variables
2. **Push, Don't Pull**: Every feature should consider proactive notification opportunities
3. **Multi-Tenant**: Every feature must work across different MCA operators
4. **Sub-Agents**: Each agent should spawn 2-3 sub-agents for parallel exploration
5. **Output Format**: Consistent markdown with tables and mermaid diagrams
