# Midday → Abacus Migration Master Document

**Status**: In Progress
**Last Updated**: 2025-01-25 (Reviewed)

---

## How This Document Works

Multiple Claude Code sessions are analyzing this codebase in parallel. Each session is assigned a specific domain and appends their findings to their designated section below.

**IMPORTANT FOR ALL SESSIONS**: Before analyzing, review the "What's Already Been Done" section below to understand completed work.

---

## What's Already Been Done (Git History Analysis)

The following migration work has already been completed. **Do not flag these as issues.**

### ✅ Completed - Branding & Domains
| Commit | Description |
|--------|-------------|
| `cb71f18a` | Initial rebrand from Midday to Abacus |
| `70d883b4` | Replace midday.ai domains → abacuslabs.com |
| `68ddfc49` | Replace api.midday.ai → api.abacuslabs.co |
| `e884cee2` | Rebrand to Abacus, remove desktop app, update FAQ |
| `acb19353` | Page titles updated to 'Abacus' |
| `cc864611` | Footer branding to "Abacus by Suphian" |

### ✅ Completed - Desktop App Removal
| Commit | Description |
|--------|-------------|
| `e884cee2` | Remove desktop app (Tauri) and related components |
| `fcfd87bf` | Remove desktop app references and Tauri-specific code |
| `04258f00` | Remove desktop verify page |

### ✅ Completed - Infrastructure
| Commit | Description |
|--------|-------------|
| `b85635d3` | Configure API for Fly.io and Vercel deployment |
| `743f0a37` | Add Supabase project configuration and migrations |
| `971fbcaa` | Add Supabase config, RLS policies, and documentation |

### ✅ Completed - Content & Features
| Commit | Description |
|--------|-------------|
| `d0f4e090` | Refocus README exclusively on MCA portfolio management |
| `50b3e439` | Rename "Apps" to "Integrations" in UI |
| `4b67086e` | Add Launch Program page for implementation services |
| `754d6f4e` | Add first update post: Introducing Abacus |
| `0b57b622` | Add email/password authentication with Google OAuth |
| `8142bee7` | Add Statsig A/B testing for hero section |
| `a9df38df` | Update Stripe pricing: Starter $499/mo, Pro $599/mo, Pro Plus $899/mo |
| `2d40c88a` | Improve OAuth error handling and UX |
| `98950851` | Fix database client for development without replicas |
| (verified) | Founder story page (`/story`) rewritten for MCA focus |
| (verified) | Pricing section updated with MCA-appropriate tiers |
| (verified) | Welcome and trial-expiring email templates branded as Abacus |

### 🔴 Still Remaining (Focus Your Analysis Here)
1. **956 files** still use `@midday/*` package imports (namespace not renamed)
2. **~20 files** still reference `midday.ai` domain (workflows, docs, some API schemas)
3. **Package names** in package.json files still use `@midday/*`
4. **Domain model** transformation not started (customers→merchants, invoices→MCAs)
5. **Freelancer features** still exist (time tracker, invoice products)
6. **Cloudflare routes** still point to engine.midday.ai
7. **Fly.io worker** still named `midday-worker`

---

## SESSION 1: Branding & Naming (Completed by Main Session)

### Summary
- 1,058+ files contain "Midday" references
- 29 packages use `@midday/*` namespace
- 7 primary domains need migration (midday.ai, cdn.midday.ai, etc.)
- 6 email addresses need updating (@midday.ai)

### Key Files
- All package.json files (29 packages)
- .github/workflows/*.yml (deployment domains)
- apps/engine/wrangler.toml (Cloudflare routes)
- packages/email/* (email templates)

---

## SESSION 2: Domain Model Mapping (Completed by Main Session)

### Summary
- Core transformation: Freelancer Platform → MCA Portfolio Management
- Key entity changes: customers→merchants, invoices→mcas, transactions→payments
- Features to REMOVE: time tracker, invoice products, recurring invoices
- Features to ADD: collections console, letter generation, risk scoring, merchant portal

### Critical Tables
- `customers` → `merchants` (add: dba, risk_score, business_type)
- `invoices` → `mcas` (funded_amount, factor_rate, payback, balance)
- Keep: teams, users_on_team, bank_accounts, documents

---

## SESSION 3: Infrastructure Analysis (Completed by Main Session)

### Summary
- Vercel: 2 projects (abacus-dashboard ✅, abacus-website needs domain update)
- Fly.io: API migrated ✅, Worker needs rename (midday-worker → abacus-worker)
- Cloudflare: Engine routes still point to midday.ai
- 956 files with @midday/* imports

### Environment Variables to Rename
- MIDDAY_ENCRYPTION_KEY → ABACUS_ENCRYPTION_KEY
- MIDDAY_DASHBOARD_URL → ABACUS_DASHBOARD_URL
- MIDDAY_CACHE_API_SECRET → ABACUS_CACHE_API_SECRET

---

## SESSION 4: Authentication & Security
<!-- Completed by Authentication & Security Expert -->

### Summary
- **Supabase Auth**: Configured with 1-hour JWT expiry, refresh token rotation enabled
- **OAuth**: Custom OAuth 2.0 server implemented with PKCE support; 5 integration OAuth flows (Gmail, Outlook, Slack, Xero, QuickBooks)
- **API Keys**: Secure implementation with encryption + hashing, `mid_*` prefix format
- **RLS Policies**: 39 of 46 tables protected; **7 CRITICAL TABLES MISSING POLICIES**
- **Migration Status**: 8+ `@midday.ai` email references remain in auth code

### Areas to Analyze
- [x] Supabase Auth configuration
- [x] OAuth flows (Gmail, Outlook, Slack, Xero, etc.)
- [x] API key management
- [x] Row Level Security policies
- [x] Session handling
- [x] JWT configuration

### Supabase Auth Configuration (`supabase/config.toml`)
| Setting | Value | Notes |
|---------|-------|-------|
| Site URL | `https://abacus-dashboard-1.vercel.app` | ✅ Updated |
| JWT Expiry | 3600s (1 hour) | Standard |
| Refresh Token Rotation | Enabled | ✅ Secure |
| Email Signup | Enabled | Confirmations disabled |
| Anonymous Sign-ins | Disabled | ✅ Secure |
| OAuth Providers | All disabled | Requires env var configuration |

### OAuth Flows Analysis

**Internal OAuth Server** (`apps/api/src/rest/routers/oauth.ts`):
- Authorization endpoint with PKCE enforcement
- Timing-safe credential validation
- Code reuse detection (RFC 6819 compliant)
- Rate limiting: 20 req/IP/15min

**Integration OAuth Callbacks**:
| Integration | File | Status |
|-------------|------|--------|
| Gmail | `apps/api/.../gmail/oauth-callback.ts` | ✅ Migrated (fallback to abacuslabs.co) |
| Outlook | `apps/api/.../outlook/oauth-callback.ts` | ✅ Migrated |
| Slack | `apps/api/.../slack/oauth-callback.ts` | ⚠️ Uses `MIDDAY_DASHBOARD_URL` env var |
| Xero | `apps/api/.../xero/oauth-callback.ts` | ✅ Migrated |
| QuickBooks | `apps/api/.../quickbooks/oauth-callback.ts` | ✅ Migrated |

### API Key Management

**Security Model** (Secure ✅):
- Format: `mid_{64-hex-chars}` (68 chars total)
- Keys encrypted before storage (`keyEncrypted`)
- Keys hashed for lookups (`keyHash`)
- Redis cache layer with 30-min TTL
- Scopes-based access control

**Files**:
- `packages/db/src/utils/api-keys.ts` - Generation
- `packages/db/src/queries/api-keys.ts` - Storage
- `apps/api/src/rest/middleware/auth.ts` - Validation

### 🔴 RLS Policy Security Gaps

**CRITICAL - Tables WITHOUT RLS Policies**:
| Table | Risk Level | Contains |
|-------|------------|----------|
| `api_keys` | **CRITICAL** | Encrypted API credentials |
| `oauth_access_tokens` | **CRITICAL** | OAuth tokens with team_id |
| `oauth_authorization_codes` | **CRITICAL** | OAuth auth codes |
| `transaction_embeddings` | HIGH | AI/ML vector data |
| `inbox_embeddings` | HIGH | AI/ML vector data |
| `transaction_match_suggestions` | HIGH | Match scoring data |
| `invoice_comments` | MEDIUM | Minimal schema currently |

**REQUIRED ACTION**: Add team-based RLS policies:
```sql
team_id IN (SELECT private.get_teams_for_authenticated_user())
```

### Remaining @midday.ai References in Auth Code

| File | Reference | Purpose |
|------|-----------|---------|
| `apps/api/src/rest/routers/oauth.ts:293` | `middaybot@midday.ai` | OAuth app notifications |
| `apps/api/src/trpc/routers/oauth-applications.ts` | `middaybot@midday.ai` | App install emails |
| `apps/api/src/trpc/routers/oauth-applications.ts` | `pontus@midday.ai` | App review requests |
| `apps/api/src/trpc/routers/api-keys.ts` | `middaybot@midday.ai` | API key notifications |
| `apps/api/src/rest/routers/webhooks/inbox/utils.ts` | `inbox@midday.ai` | Email forwarding |
| `apps/website/src/app/policy/page.tsx` | `support@midday.ai` | Policy contact |
| `apps/website/src/app/terms/page.tsx` | `support@midday.ai`, `dmca@midday.ai` | Terms/DMCA |

### Environment Variables to Rename
- `MIDDAY_DASHBOARD_URL` → `ABACUS_DASHBOARD_URL`
- `MIDDAY_ENCRYPTION_KEY` → `ABACUS_ENCRYPTION_KEY`
- `MIDDAY_CACHE_API_SECRET` → `ABACUS_CACHE_API_SECRET`

### Session & JWT Configuration
- JWT verified via JWKS at `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
- No session timeout configured (relies on JWT expiry)
- No inactivity timeout configured
- Refresh token reuse interval: 10 seconds

### Security Strengths ✅
1. Proper JWT verification with remote JWKS
2. Timing-safe credential validation (prevents timing attacks)
3. PKCE enforcement for public OAuth clients
4. API keys encrypted AND hashed
5. Rate limiting on auth endpoints
6. Code reuse detection with automatic token revocation

### Security Concerns ⚠️
1. **7 tables missing RLS** - Critical data exposure risk
2. **@midday.ai emails** - 8+ references need updating
3. **No SMTP configured** - Email notifications won't work
4. **Session timeouts disabled** - Consider enabling for compliance
5. **Wildcard redirect URLs** - `/**` patterns are permissive

### Action Items for Auth Migration

| Priority | Item | Files |
|----------|------|-------|
| **P0** | Add RLS policies to api_keys, oauth_access_tokens, oauth_authorization_codes | `supabase/migrations/` |
| **P0** | Update @midday.ai emails to @abacuslabs.co | 7 files listed above |
| **P1** | Rename MIDDAY_* env vars | `.env` templates, Vercel, Fly.io |
| **P1** | Add RLS to embedding tables | `supabase/migrations/` |
| **P2** | Configure SMTP for production | `supabase/config.toml` |
| **P2** | Consider tightening redirect URL wildcards | `supabase/config.toml` |
| **P3** | Enable session timeout for compliance | `supabase/config.toml` |

---

## SESSION 5: UI Components & Design System
<!-- Completed by UI Components Expert session -->

### Areas to Analyze
- [x] packages/ui components inventory
- [x] Branding elements (logos, colors, fonts)
- [x] Dashboard layout components
- [x] MCA-specific UI needs (merchant cards, risk badges, payment tables)
- [x] Shadcn/Radix component usage

### Findings

#### 1. UI Components Inventory (72 components)

**Location**: `packages/ui/src/components/`

| Category | Components | Count |
|----------|-----------|-------|
| **Form Controls** | Input, Textarea, Select, Checkbox, Radio Group, Switch, Label, Slider, Input OTP | 9 |
| **Buttons/Actions** | Button, Submit Button, Badge, Actions | 4 |
| **Overlays** | Dialog, Alert Dialog, Sheet, Drawer, Popover, Hover Card, Context Menu, Dropdown Menu | 8 |
| **Navigation** | Tabs, Navigation Menu, Collapsible, Accordion | 4 |
| **Feedback** | Toast, Toaster, Alert, Progress, Loader, Skeleton | 6 |
| **Data Display** | Table, Card, Carousel, Scroll Area, Avatar | 5 |
| **Selection** | Command, Combobox, Combobox Dropdown, Multiple Selector | 4 |
| **Rich Content** | Editor (TipTap), Code Block, Inline Citation | 3 |
| **AI/Chat** | Conversation, Message, Prompt Input, Response, Reasoning, Tool, Tool Call Indicator, Sources, Suggestion | 9 |
| **Specialized Input** | Currency Input, Email Tag Input, Quantity Input, Time Range Input, Date Range Picker, Calendar | 6 |
| **Animation/Effects** | Text Effect, Text Shimmer, Animated Size Container | 3 |
| **Utilities** | Icons, Image, Branch, Separator, Tooltip | 5 |

#### 2. Midday Branding in UI Package

**Files with @midday imports** (3 files):
| File | Import | Fix Required |
|------|--------|--------------|
| `response.tsx` | `@midday/utils/envs` | Update to @abacus/utils |
| `prompt-input.tsx` | `@midday/ui/*` (self-reference bug) | Change to relative imports |
| `email-tag-input.tsx` | `@midday/utils` | Update to @abacus/utils |
| `package.json` | Package name `@midday/ui` | Rename to `@abacus/ui` |

**No visual Midday branding** - No logos, text strings, or imagery reference "Midday"

#### 3. Design System Architecture

**Stack**: Radix UI primitives + Tailwind CSS + CVA (Class Variance Authority)

**24 Radix UI packages in use**:
- Accordion, Alert Dialog, Avatar, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Hover Card, Icons, Label, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Slot, Switch, Tabs, Toast, Tooltip

**Styling Pattern**:
```typescript
// cn() utility combines clsx + tailwind-merge
cn("base-classes", conditional && "conditional-class", className)

// CVA for type-safe variants (used in button, badge, alert, toast, sheet)
const buttonVariants = cva("base", { variants: { variant: {...}, size: {...} }})
```

**Color System** (HSL CSS variables in `globals.css`):
- Light mode: White background, beige accents, dark text
- Dark mode: Near-black background, gray accents, light text
- Semantic colors: primary, secondary, destructive, muted, accent

**Typography**:
- Sans: `var(--font-hedvig-sans)`
- Serif: `var(--font-hedvig-serif)`
- Mono: Currently same as sans (should be fixed)

#### 4. Dashboard Layout Structure

**Main Layout** (`apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx`):
```
┌─────────────────────────────────────────────┐
│ Sidebar (70px collapsed → 240px expanded)   │
│ ┌─────────┬───────────────────────────────┐ │
│ │         │ Header (70px)                 │ │
│ │  Menu   ├───────────────────────────────┤ │
│ │  Items  │                               │ │
│ │         │     Content Area              │ │
│ │         │     (px-4 md:px-8)            │ │
│ │         │                               │ │
│ └─────────┴───────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Key Layout Components**:
- `sidebar.tsx` - Collapsible navigation with team dropdown
- `header.tsx` - Search, notifications, user menu (70px height)
- `main-menu.tsx` - Primary navigation items

#### 5. Pages: Freelancer-Specific vs. Reusable

| Page | Current Purpose | MCA Transformation |
|------|-----------------|-------------------|
| **Overview** | AI chat + widgets | ✅ Keep - Update widgets for MCA metrics |
| **Transactions** | Bank transactions | ✅ Keep - Rename to "Funding & Settlements" |
| **Inbox** | Notifications | ✅ Keep - Rebrand for MCA alerts |
| **Invoices** | Client invoices | 🔄 Transform → "Portfolio" or "MCAs" |
| **Tracker** | Time tracking | ❌ Remove or transform → "Activity Log" |
| **Customers** | Client management | 🔄 Rename → "Merchants" |
| **Vault** | Document storage | ✅ Keep - Perfect for MCA contracts |
| **Apps** | Integrations | ✅ Keep (renamed to "Integrations") |
| **Settings** | Configuration | ✅ Keep - Minor terminology updates |

#### 6. Freelancer-Specific Components to Address

**Time Tracking (2 components)**:
- `time-range-input.tsx` - Start/stop time with duration
- `record-button.tsx` - Recording state with waveform animation
- **Decision**: Remove or repurpose for merchant activity logging

**Invoice-Related Dashboard Components**:
- `apps/dashboard/src/components/tables/invoices/` - Full invoice table
- `InvoicesOpen`, `InvoicesOverdue`, `InvoicesPaid` summary cards
- `InvoicePaymentScore` - Payment reliability metric
- **Decision**: Transform into MCA portfolio components

**Customer Table**:
- `apps/dashboard/src/components/tables/customers/` - Client management
- Columns: name, website, total invoiced, activity, tags
- **Decision**: Rename to Merchants, add MCA columns

#### 7. MCA-Specific Components Needed (NEW)

| Component | Purpose | Priority |
|-----------|---------|----------|
| **MerchantCard** | Display merchant with risk score, balance, status | High |
| **RiskBadge** | Visual risk level indicator (Low/Med/High/Critical) | High |
| **PaymentScheduleTable** | Show expected vs. actual payments | High |
| **PortfolioSummaryCards** | Total funded, active, at-risk, due soon | High |
| **NSFAlert** | Non-sufficient funds notification | Medium |
| **FactorRateDisplay** | Format factor rates (1.35x) | Medium |
| **RTRStatusBadge** | Right to Receivables status | Medium |
| **FundingTimeline** | Merchant funding history | Medium |
| **CollectionsQueue** | Merchants needing attention | Medium |
| **WeeklySummaryWidget** | Portfolio health overview | Low |

#### 8. Key Files for UI Migration

**Config Files**:
- `packages/ui/package.json` - Rename @midday/ui → @abacus/ui
- `packages/ui/tailwind.config.ts` - Theme configuration
- `packages/ui/src/globals.css` - CSS variables

**Components Needing @midday Import Updates**:
- `packages/ui/src/components/response.tsx`
- `packages/ui/src/components/prompt-input.tsx`
- `packages/ui/src/components/email-tag-input.tsx`

**Dashboard Pages to Transform**:
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/invoices/` → Portfolio
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/customers/` → Merchants
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/tracker/` → Remove/Transform

**Navigation**:
- `apps/dashboard/src/components/main-menu.tsx` - Update menu items
- `apps/dashboard/src/components/sidebar.tsx` - Update branding

### Summary

**Good News**:
- UI library is well-abstracted with no visual Midday branding
- Radix/Shadcn foundation provides excellent accessibility
- Most components are domain-agnostic and reusable
- AI/chat components are sophisticated and ready for MCA use

**Work Required**:
1. Namespace rename: @midday/ui → @abacus/ui (affects 956 files)
2. Fix self-referencing imports in prompt-input.tsx
3. Transform Invoices → Portfolio page with MCA columns
4. Transform Customers → Merchants page with MCA fields
5. Remove or repurpose Tracker page
6. Build 10 new MCA-specific components
7. Update main-menu.tsx navigation labels

---

## SESSION 6: Database Schema Deep Dive
<!-- Completed by database analysis session -->

### Areas to Analyze
- [x] Current table structure (all migrations)
- [x] RLS policies audit
- [x] Foreign key relationships
- [x] Indexes and performance
- [x] Migration strategy (rename vs. new tables)

### Findings

#### Migration Files
| File | Lines | Purpose |
|------|-------|---------|
| `20260119005908_remote_schema.sql` | 0 | Empty placeholder |
| `20260119052651_remote_schema.sql` | ~3,200 | Complete Midday schema dump |
| `20260119060000_add_users_on_team_and_auth_trigger.sql` | 124 | Auth sync, users_on_team, RLS policies |
| `20260119070000_seed_demo_data.sql` | 145 | Demo merchants & MCA categories |

#### Complete Table Inventory (43 Tables)

##### MCA-CORE: Keep/Adapt (19 tables)
| Table | MCA Usage | Action |
|-------|-----------|--------|
| `customers` | Merchant records | **Rename → `merchants`** |
| `customer_tags` | Merchant classification | Keep |
| `transactions` | ACH payments, NSFs | Keep |
| `transaction_categories` | MCA payment types | Keep (already seeded) |
| `transaction_tags` | Payment tagging | Keep |
| `transaction_attachments` | Receipt storage | Keep |
| `transaction_enrichments` | AI categorization | Keep |
| `transaction_embeddings` | Vector search | Keep |
| `transaction_match_suggestions` | AI matching | Keep |
| `bank_accounts` | Operator accounts | Keep |
| `bank_connections` | Plaid/Teller links | Keep |
| `teams` | MCA operators | Keep |
| `users` | Team members | Keep |
| `users_on_team` | Memberships | Keep |
| `api_keys` | Partner API | Keep |
| `notification_settings` | Alert config | Keep |
| `activities` | Audit log | Keep |
| `tags` | Generic tags | Keep |

##### FREELANCER-SPECIFIC: Archive/Remove (8 tables)
| Table | Freelancer Purpose | Action |
|-------|-------------------|--------|
| `invoices` | Client billing | Archive (incompatible with ACH model) |
| `invoice_products` | Service catalog | Archive |
| `invoice_recurring` | Subscription billing | Archive |
| `invoice_templates` | Invoice design | Archive |
| `invoice_comments` | Invoice notes | Archive (empty schema) |
| `tracker_entries` | Time tracking | Remove |
| `tracker_projects` | Project management | Remove |
| `tracker_project_tags` | Project tags | Remove |
| `tracker_reports` | Time reports | Remove |

##### INFRASTRUCTURE: Keep (16 tables)
| Table | Purpose |
|-------|---------|
| `documents` | Contract/ACH form storage |
| `document_tags` | Document classification |
| `document_tag_assignments` | Tag mapping |
| `document_tag_embeddings` | Semantic search |
| `inbox` | ACH confirmation processing |
| `inbox_accounts` | Email connections |
| `inbox_blocklist` | Spam filtering |
| `inbox_embeddings` | Email search |
| `oauth_applications` | Partner apps |
| `oauth_access_tokens` | Token management |
| `oauth_authorization_codes` | OAuth flow |
| `reports` | Portfolio reports |
| `short_links` | Sharing links |
| `accounting_sync_records` | QuickBooks/Xero sync |
| `exchange_rates` | Multi-currency |
| `transaction_category_embeddings` | AI categories |

#### Enums (26 total)

**MCA-Relevant:**
- `account_type`: depository, credit, loan, other_asset, other_liability
- `transactionMethods`: ach, wire, payment, transfer, fee, interest, deposit, card_purchase, card_atm, other, unknown
- `transactionStatus`: posted, pending, completed, archived, exported, excluded
- `transaction_frequency`: daily, weekly, biweekly, monthly, semi_monthly, annually, irregular, unknown
- `plans`: trial, starter, pro
- `subscription_status`: active, past_due
- `teamRoles`: owner, member
- `bank_providers`: plaid, gocardless, teller, enablebanking

**Freelancer-Specific (ignore):**
- `invoice_status`, `invoice_recurring_*`, `trackerStatus`, `invoice_delivery_type`, `invoice_size`

#### RLS Policies Defined

**users_on_team:**
- SELECT: Users view own memberships (`auth.uid() = user_id`)
- INSERT: Users can create memberships (`auth.uid() = user_id`)
- ALL: Owners manage all in team

**teams:**
- SELECT: Users view their teams
- UPDATE: Owners update their teams
- INSERT: Authenticated users can create

**All other tables:** RLS enabled, policies managed in production

#### Foreign Key Relationships
- `users_on_team.user_id` → `users(id)` ON DELETE CASCADE
- `users_on_team.team_id` → `teams(id)` ON DELETE CASCADE
- `transactions.bank_account_id` → `bank_accounts(id)` [implicit]
- `customers.team_id` → `teams(id)` [implicit]
- `tracker_projects.customer_id` → `customers(id)` [implicit]

#### Key Indexes
- Full-text search: `customers.fts`, `transactions.fts_vector`, `documents.fts`, `inbox.fts`
- Team isolation: All tables have `team_id` indexed
- Vector embeddings: `transaction_embeddings.embedding`, `document_tag_embeddings.embedding`

#### Demo Data Already Seeded
- **Team:** Abacus Capital (pro plan)
- **Bank Account:** Abacus Capital Operating ($847,592.45)
- **Categories:** MCA Payments, NSF Returns, Funding Disbursements, ISO Commissions, Operating Expenses
- **Merchants:** 10 demo merchants (3 healthy, 2 at-risk, 1 high-risk, 2 new, 2 paid-off)

#### Migration Strategy Recommendation

**Phase 1: Non-Breaking Changes**
1. Create view `merchants` aliasing `customers` (backward compat)
2. Add MCA columns to `customers`: `dba_name`, `risk_score`, `risk_level`, `nsf_count`, `mca_status`

**Phase 2: New MCA Tables**
- `mcas` (funded_amount, factor_rate, payback_amount, balance, payment_frequency, daily_payment, funded_at, payoff_date, status)
- `payment_schedule` (mca_id, expected_date, expected_amount, actual_amount, status)
- `collection_activities` (mca_id, merchant_id, type, notes, created_by)
- `letters` (mca_id, merchant_id, template, generated_content, sent_at, delivery_method)

**Phase 3: Cleanup**
1. Archive invoice/tracker tables (soft delete, keep data)
2. Remove freelancer-specific enums from active use
3. Update TypeScript types via `supabase gen types`

#### Critical Files
- [supabase/migrations/](supabase/migrations/) - Add new migrations
- [packages/supabase/src/types/db.ts](packages/supabase/src/types/db.ts) - Regenerate types
- [apps/dashboard/src/](apps/dashboard/src/) - Update customer→merchant refs

---

## SESSION 7: API Routes & Endpoints
**Analyzed by**: API Routes Expert Session
**Date**: 2025-01-25

### Areas to Analyze
- [x] tRPC routers inventory
- [x] REST endpoints in apps/api
- [x] MCP server tools
- [x] Endpoint naming (freelancer vs MCA terminology)
- [ ] API documentation (OpenAPI at /openapi endpoint)

### Findings

#### 1. Overall Architecture
- **Framework**: Hono + OpenAPI (REST), tRPC (RPC)
- **Location**: `apps/api/src/`
- **@midday/* imports**: 343 occurrences across 142 files

#### 2. tRPC Routers (38 total)

##### 🔴 FREELANCER-SPECIFIC (Remove/Transform)
| Router | File | Action |
|--------|------|--------|
| `trackerProjects` | tracker-projects.ts | **REMOVE** |
| `trackerEntries` | tracker-entries.ts | **REMOVE** |
| `invoice` | invoice.ts | **TRANSFORM** → `mcas` |
| `invoicePayments` | invoice-payments.ts | **TRANSFORM** |
| `invoiceProducts` | invoice-products.ts | **REMOVE** |
| `invoiceRecurring` | invoice-recurring.ts | **REMOVE** |

##### 🟡 RENAME: `customers` → `merchants`

##### ✅ KEEP (26 routers): bankAccounts, transactions, documents, inbox, team, user, notifications, apps, billing, reports, search, tags, etc.

#### 3. REST Endpoints

##### Remove
- `/tracker-projects`, `/tracker-entries`

##### Transform
- `/invoices` → `/mcas`
- `/customers` → `/merchants`
- `/invoice-payments` → MCA payments

#### 4. MCP Server
**Critical**: Server named `"midday"` at `src/mcp/server.ts:20` → rename to `"abacus"`

##### Tools to Remove/Transform
| Tool | Action |
|------|--------|
| `registerTrackerTools` | **REMOVE** |
| `registerInvoiceTools` | **TRANSFORM** |
| `registerCustomerTools` | **RENAME** → merchants |

#### 5. NEW MCA Endpoints Needed
- **merchants**: Add dba, riskScore, businessType, dailyAch, nsfCount
- **mcas**: fundedAmount, factorRate, paybackAmount, balance, term
- **collections**: getQueue, addNote, generateLetter, getHistory
- **risk**: calculate, getAlerts, getHistory
- **portfolio**: getSummary, getMetrics, getWeeklySummary

#### 6. Priority Files
| Priority | File | Change |
|----------|------|--------|
| P0 | `src/mcp/server.ts` | Rename server |
| P1 | `src/trpc/routers/_app.ts` | Remove tracker |
| P2 | `src/trpc/routers/customers.ts` | → merchants |
| P2 | `src/mcp/tools/tracker.ts` | DELETE |
| P3 | 142 files | @midday/* → @abacus/* |

#### 7. Breaking Changes
- API consumers using `/invoices` will break
- MCP tool names change (e.g., `invoices_list` → `mcas_list`)
- Webhook payloads reference invoice terminology

---

## SESSION 8: Background Jobs & Automation

### Areas to Analyze
- [x] Trigger.dev jobs inventory
- [x] Email automation (weekly summaries, alerts)
- [x] Bank sync jobs
- [x] Document processing jobs
- [x] MCA-specific jobs needed

### Findings

#### Job Infrastructure Overview
The codebase has **two parallel job systems**:
1. **Trigger.dev** (packages/jobs/) - 41 scheduled/event-driven jobs
2. **BullMQ Worker** (apps/worker/) - Redis-based queue processing

#### Trigger.dev Jobs Inventory (41 files)

| Category | Files | MCA Relevance |
|----------|-------|---------------|
| Bank Sync | 6 | ✅ Critical - monitors merchant bank accounts |
| Invoice | 7 | ✅ Transform to MCA payment tracking |
| Transactions | 8 | ✅ Critical - payment monitoring |
| Document Processing | 5 | ✅ MCA contract storage |
| Inbox/Email Sync | 7 | ✅ Payment matching |
| Team/User | 4 | ⚠️ Onboarding has Midday branding |
| Notifications | 2 | ✅ Alerts infrastructure |
| Rates | 1 | ⚠️ Less relevant for MCA |

#### @midday/* Package Usage in Jobs
All 41 jobs import from @midday/* packages:
- `@midday/supabase` - Database client
- `@midday/email` - Email templates
- `@midday/documents` - Document classification
- `@midday/invoice` - PDF generation
- `@midday/engine-client` - Banking API client
- `@midday/import` - Transaction import
- `@midday/notifications` - Alert system

**Impact**: Package namespace rename affects ALL job files.

#### Freelancer-Specific Jobs (Requires Rebranding)

**team/onboarding.ts** - Uses hardcoded Midday branding:
- Line 45: `from: "Pontus from Midday <pontus@midday.ai>"`
- Sends: WelcomeEmail, GetStartedEmail, TrialExpiringEmail, TrialEndedEmail
- All email templates reference "Midday"

#### Bank Sync Jobs (MCA-Critical)
Located in `packages/jobs/src/tasks/bank/`:
- `bank-scheduler.ts` - Triggers sync for all connections
- `sync/connection.ts` - Per-connection sync
- `sync/account.ts` - Balance and transaction sync
- `notifications/transactions.ts` - New transaction alerts

**Providers**: Plaid, GoCardless, Teller, EnableBanking

#### Email Automation
| Job | Purpose | Status |
|-----|---------|--------|
| team/onboarding.ts | Welcome sequence (days 0,3,14,29) | ⚠️ Midday branding |
| team/invite.ts | Team invites | ✅ Uses i18n |
| invoice/send-email.ts | Invoice delivery | ✅ Generic |
| invoice/send-reminder.ts | Payment reminders | ✅ Transform for MCA |

Uses **Resend** for email delivery via `@midday/email`.

#### Document Processing Pipeline
1. `process-document.ts` - Entry point, MIME detection
2. `classify-document.ts` / `classify-image.ts` - ML classification
3. `embed-document-tags.ts` - Vector embeddings for search

ML models from `@midday/documents` - can classify MCA contracts.

### MCA-Specific Jobs Needed (Not Yet Implemented)

| Job | Purpose | Priority |
|-----|---------|----------|
| **collection-reminders** | Automated payment reminders before due dates | P0 |
| **risk-alerts** | Notify when merchant risk score changes | P0 |
| **payment-monitoring** | Detect NSF/late payments from bank data | P0 |
| **weekly-portfolio-summary** | Email digest of portfolio health | P0 |
| **stacking-detection** | Alert when merchant takes additional MCAs | P1 |
| **balance-threshold-alerts** | Alert when bank balance drops below threshold | P1 |
| **merchant-health-check** | Periodic merchant business health assessment | P2 |

### Action Items

#### Immediate (Namespace Migration)
1. [ ] Rename all @midday/* imports → @abacus/* across 41 job files
2. [ ] Update `packages/jobs/package.json` name field
3. [ ] Update worker package name and Fly.io app name

#### Phase 1 (Branding)
1. [ ] Update `team/onboarding.ts` sender email (pontus@midday.ai → team@abacuslabs.co)
2. [ ] Rebrand all email templates in @midday/email → @abacus/email
3. [ ] Update email content for MCA context

#### Phase 2 (Feature Transform)
1. [ ] Transform `invoice/send-reminder.ts` → `mca/payment-reminder.ts`
2. [ ] Adapt `bank/notifications/transactions.ts` for NSF detection
3. [ ] Build collection reminders job

#### Phase 3 (New MCA Jobs)
1. [ ] Create `mca/weekly-summary.ts` - Portfolio digest
2. [ ] Create `mca/risk-alerts.ts` - Risk score changes
3. [ ] Create `mca/payment-monitoring.ts` - Late payment detection
4. [ ] Create `mca/balance-alerts.ts` - Low balance warnings

### Key Files
- packages/jobs/src/tasks/** (41 job files)
- apps/worker/src/** (BullMQ worker system)
- packages/email/emails/** (email templates)
- packages/jobs/package.json
- apps/worker/fly.toml (still named midday-worker)

---

## SESSION 9: Third-Party Integrations
<!-- Completed by Tab 7 - Integrations Expert -->

### Areas to Analyze
- [x] Banking: Plaid, GoCardless, Teller, EnableBanking
- [x] Accounting: Xero, QuickBooks, Fortnox
- [x] Payments: Stripe, Polar
- [x] Communication: Slack, Gmail, Outlook, WhatsApp
- [x] Which to keep vs. remove for MCA

### Findings

**Completed Analysis**: 22 integrations analyzed across 7 categories

#### Integration Inventory Summary

| Category | Keep | Remove | Modify |
|----------|------|--------|--------|
| Banking Providers | 4 | 0 | 0 |
| Accounting | 2 | 2 | 0 |
| Payments | 1 | 2 | 0 |
| Communication | 4 | 0 | 2 |
| AI/MCP | 2 | 2 | 0 |
| Storage | 0 | 2 | 0 |
| Misc | 0 | 3 | 0 |
| **Total** | **13** | **11** | **2** |

#### Banking Providers (KEEP ALL - CRITICAL)
- **Plaid**, **GoCardLess**, **Teller**, **EnableBanking** - All 4 in `apps/engine/src/providers/`
- No @midday/* imports - clean
- These are the FOUNDATION of MCA payment tracking (NSF detection, cash flow monitoring)

#### Accounting (KEEP 2, REMOVE 2)
- **KEEP**: Xero, QuickBooks (U.S. accounting compliance)
- **REMOVE**: Fortnox (Swedish-only), E-Invoice (European B2B)

#### Payments (KEEP 1, REMOVE 2)
- **KEEP**: Stripe Payments (repurpose for merchant ACH collection)
- **REMOVE**: Stripe sync (redundant), Polar (creator subscriptions)

#### Communication (KEEP ALL - MODIFY 2)
- **KEEP**: Slack (CRITICAL), WhatsApp (HIGH), Gmail, Outlook
- **MODIFY**: Slack (6 @midday imports), WhatsApp (2 @midday imports)
- Slack enables real-time NSF alerts and team collaboration
- WhatsApp enables mobile document capture from merchants/brokers

#### AI/MCP (KEEP 2, REMOVE 2)
- **KEEP**: Claude MCP, ChatGPT MCP (AI-powered portfolio analysis)
- **REMOVE**: Raycast MCP, Cursor MCP (developer tools, not MCA business users)

#### Storage & Misc (REMOVE ALL)
- **REMOVE**: Google Drive, Dropbox (external storage unnecessary)
- **REMOVE**: Deel (payroll), Cal.com (calendar), Raycast (time tracking)

#### @midday/* Imports Requiring Update

| Integration | File Location | Import Count |
|-------------|---------------|--------------|
| Slack | `packages/app-store/src/slack/server/*` | 6 imports |
| WhatsApp | `packages/app-store/src/whatsapp/server/*` | 2 imports |
| **Total** | | **8 imports** |

**Slack imports to update:**
- `@midday/db/client` → `@abacus/db/client`
- `@midday/db/queries` → `@abacus/db/queries`
- `@midday/db/worker-client` → `@abacus/db/worker-client`
- `@midday/job-client` → `@abacus/job-client`
- `@midday/logger` → `@abacus/logger`
- `@midday/utils/envs` → `@abacus/utils/envs`

**WhatsApp imports to update:**
- `@midday/job-client` → `@abacus/job-client`
- `@midday/logger` → `@abacus/logger`

#### Key Files

| File | Purpose |
|------|---------|
| `packages/app-store/src/index.ts` | Remove deprecated integration exports |
| `apps/dashboard/src/components/apps.tsx` | Main integration list component |
| `apps/dashboard/src/components/unified-app.tsx` | Individual integration card UI |
| `apps/engine/src/providers/*` | Banking provider implementations |
| `apps/dashboard/src/hooks/use-app-oauth.ts` | OAuth flow management |

#### Action Items

**Phase 1: Import Updates (with namespace migration)**
1. [ ] Update 6 @midday/* imports in Slack integration
2. [ ] Update 2 @midday/* imports in WhatsApp integration

**Phase 2: Integration Cleanup**
1. [ ] Remove 11 deprecated integrations from packages/app-store/src/index.ts
2. [ ] Update dashboard components to not display removed integrations

**Phase 3: Repurposing (Future)**
1. [ ] Repurpose Stripe Payments for merchant ACH collection
2. [ ] Update Slack notifications for MCA terminology (merchants, payments, risk)
3. [ ] Customize WhatsApp for merchant document intake workflow

---

## SESSION 10: Testing & Quality

### Areas Analyzed
- [x] Test coverage inventory
- [x] Test files with Midday references
- [x] E2E test scenarios
- [x] MCA-specific test cases needed
- [x] CI/CD test pipeline

### Findings

#### Test File Inventory (29 files total)

| Location | Files | Coverage Area |
|----------|-------|---------------|
| `packages/db/src/test/` | 6 | Transaction matching, bank accounts, invoices, reports |
| `apps/engine/src/providers/` | 5 | Plaid, GoCardless, Teller, EnableBanking transforms |
| `packages/invoice/src/utils/` | 3 | Calculate, currency, recurring |
| `packages/accounting/src/providers/` | 3 | Fortnox, QuickBooks, Xero |
| `apps/worker/src/processors/` | 2 | Categorization, export |
| `packages/jobs/src/utils/` | 2 | Account matching, transform |
| Other packages | 8 | Encryption, documents, inbox, tax, etc. |

#### Testing Framework
- **Framework**: Bun native test runner (`bun:test`)
- **Syntax**: `describe()`, `test()`, `expect()`, `mock()` from `bun:test`
- **Cache**: Disabled in turbo.json (`"cache": false`) - tests always run fresh

#### CI/CD Test Pipeline

All 13 GitHub Actions workflows include test execution:

```yaml
- name: 🧪 Run tests
  run: bunx turbo run test --filter=@midday/[app-name]...
```

**Workflows with Tests:**
- production-dashboard.yml, production-api.yaml, production-engine.yml
- production-worker.yaml, production-jobs.yml, production-website.yml
- beta-dashboard.yaml, preview-api.yaml, preview-engine.yml
- preview-website.yml, staging-jobs.yml, staging-worker.yaml

✅ **CI/CD is solid** - no changes needed to test execution pattern

#### Midday References in Tests

Only **3 test files** contain `@midday/*` imports:
1. `packages/jobs/src/utils/account-matching.test.ts`
2. `packages/db/src/test/reports.test.ts`
3. `apps/worker/src/processors/accounting/export-transactions.test.ts`

These are package namespace imports (not Midday-specific business logic) and will be automatically fixed when `@midday/*` → `@abacus/*` namespace migration is performed.

#### E2E Test Status

❌ **No E2E tests configured**
- No Playwright, Cypress, or other E2E framework found
- Dashboard and website apps have no frontend tests
- Only backend/logic unit tests exist

#### What's Currently Well-Tested

| Domain | Test Quality |
|--------|-------------|
| Transaction matching | ⭐⭐⭐ Excellent (unit, integration, golden dataset) |
| Financial reports | ⭐⭐⭐ Excellent |
| Provider transforms | ⭐⭐ Good |
| Accounting integrations | ⭐⭐ Good |
| Invoice calculations | ⭐⭐ Good |
| Encryption | ⭐⭐ Good |

#### What's NOT Tested

| Area | Risk |
|------|------|
| Dashboard UI components | Medium |
| Website pages | Low |
| E2E user flows | High |
| MCA-specific features | High (not yet built) |

### MCA-Specific Test Cases Needed

When building MCA features, create tests for:

1. **Merchant Management**
   - Merchant CRUD operations
   - Risk score calculations
   - DBA name handling

2. **MCA Calculations**
   - Factor rate to payback calculation
   - RTR balance tracking
   - Payment schedule generation

3. **Collections**
   - NSF detection and alerting
   - Payment default identification
   - Letter generation triggers

4. **Payment Processing**
   - Daily ACH payment recording
   - RTR balance updates
   - Overpayment handling

5. **Reporting**
   - Portfolio summary calculations
   - Risk distribution analysis
   - Collection rate metrics

### Recommended Actions

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Migrate `@midday/*` imports in 3 test files (with namespace migration) | Low |
| P1 | Add Playwright for E2E testing | Medium |
| P2 | Create MCA domain test suite as features are built | Ongoing |
| P3 | Add test coverage reporting (c8 or similar) | Low |

### Test Script Reference

```bash
# Run all tests
bun test

# Run specific test suites (from packages/db)
bun test:matching       # Transaction matching
bun test:integration    # Integration tests
bun test:golden         # Golden dataset regression
bun test:reports        # Financial reports
bun test:watch          # Watch mode
```

### Key Files
- packages/db/src/test/** (core financial tests)
- apps/engine/src/providers/** (provider transformation tests)
- .github/workflows/** (CI/CD pipelines)
- turbo.json (test configuration)

---

## SESSION 11: SEO, Analytics & Marketing
**Analyzed by**: SEO & Marketing Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] Meta tags, OpenGraph images, Twitter cards
- [x] Analytics configuration (OpenPanel, Statsig, Sentry)
- [x] Marketing site content (apps/website/src)
- [x] Social sharing images and links
- [x] Sitemap.ts, robots.ts configuration
- [x] Header/footer branding elements

### Findings

#### 1. OpenGraph & Twitter Cards (CRITICAL)

**17 CDN image references** still point to `cdn.midday.ai`:

| File | References | Content |
|------|------------|---------|
| `apps/website/src/app/layout.tsx` | 6 | OG images + preconnect |
| `apps/dashboard/src/app/[locale]/layout.tsx` | 4 | OG images |
| `apps/dashboard/src/components/login-video-background.tsx` | 3 | Video poster + source |
| `apps/website/src/components/startpage.tsx` | 2 | Video poster + source |
| `apps/website/src/components/insights.tsx` | 1 | Audio file |
| `apps/dashboard/src/components/bank-logo.tsx` | 2 | Fallback image |

**Font Resources (4 instances)**:
- `dashboard/.../opengraph-image.tsx` files load fonts from `cdn.midday.ai/fonts/`

#### 2. Analytics Configuration (✅ Mostly Clean)

**OpenPanel** (`packages/events/`):
- ✅ Event names are MCA-appropriate (no "midday" or freelancer terminology)
- Events: "User Signed In", "Connect Bank", "Export Transaction", etc.
- Configured via environment variables

**Statsig A/B Testing** (`apps/website/`):
- ✅ Visitor ID stored as `abacus_visitor_id`
- ✅ All 9 hero text variants are MCA-focused
- Experiment: `hero_text` with MCA business messaging

**Sentry** (`apps/dashboard/`, `apps/worker/`):
- ✅ DSN and project configured via environment variables (not hardcoded)
- Server/edge/client configs properly set up

**No Issues Found**: PostHog, Google Analytics, Plausible not present

#### 3. Social Media & Status Links (CRITICAL)

**Header** (`apps/website/src/components/header.tsx`):
- Line 205: `aria-label="Midday - Go to homepage"`
- Line 211: `<span>midday</span>` (logo text)

**Footer** (`apps/website/src/components/footer.tsx`):
- Line 76: Twitter → `https://x.com/middayai`
- Line 81: LinkedIn → `https://www.linkedin.com/company/midday-ai`
- Line 192: Status page → `https://midday.openstatus.dev/`
- ✅ Copyright correctly shows "Abacus by Suphian"

**UTM Tracking** (`apps/dashboard/src/components/favicon-stack.tsx`):
- Line 29: `utm_source=midday.ai` → should be `utm_source=abacuslabs.co`

#### 4. Sitemap & Robots (✅ Clean)

- `apps/website/src/app/robots.ts` → Uses `https://abacuslabs.co` ✅
- `apps/website/src/app/sitemap.ts` → Uses `https://abacuslabs.co` ✅

Both files are properly configured for Abacus domain.

#### 5. Email Addresses in Legal Pages

**Policy Page** (`apps/website/src/app/policy/page.tsx`):
- Lines 730, 733: `support@midday.ai`

**Terms Page** (`apps/website/src/app/terms/page.tsx`):
- Line 302: `dmca@midday.ai`
- Lines 454, 457: `support@midday.ai`

#### 6. Freelancer-Focused Marketing Content

**Pages to Transform or Remove**:

| Page | Current Content | Recommended Action |
|------|-----------------|-------------------|
| `app/time-tracking/page.tsx` | "Track your hours with ease" | **REMOVE** or redirect |
| `app/invoicing/page.tsx` | "Create web-based invoices" | **REMOVE** or redirect |
| `components/time-tracking.tsx` | Billable hours, client projects | **REMOVE** |
| `components/invoicing.tsx` | Invoice creation features | **REMOVE** |

**Navigation with Freelancer Links**:
- Header dropdown includes Time tracking, Invoicing links
- Footer includes Time tracking, Invoicing links

#### 7. Summary of Midday References

| Category | Count | Priority |
|----------|-------|----------|
| CDN image/video URLs | 17 | **P0** |
| Font resource URLs | 4 | **P0** |
| Social media links | 2 | **P0** |
| Status page URL | 1 | **P0** |
| Header branding | 2 | **P0** |
| UTM tracking | 1 | **P1** |
| Email addresses | 5 | **P1** |
| Freelancer pages | 4 | **P1** |
| Navigation links | 4 | **P1** |

### Action Items

#### Phase 1: Critical Branding (P0)
1. [ ] Upload OG images to Abacus CDN/storage
2. [ ] Replace all `cdn.midday.ai` URLs with Abacus hosting
3. [ ] Update `header.tsx` logo text and aria-label
4. [ ] Update `footer.tsx` social media links (create @abacuslabs accounts)
5. [ ] Set up `status.abacuslabs.co` (OpenStatus or similar)

#### Phase 2: Legal & Marketing (P1)
1. [ ] Replace `@midday.ai` emails with `@abacuslabs.co`
2. [ ] Remove Time tracking page or redirect to Portfolio
3. [ ] Remove Invoicing page or redirect to MCAs
4. [ ] Update navigation (header, footer) to remove freelancer links

#### Phase 3: Analytics Cleanup (P2)
1. [ ] Update UTM source parameter in favicon-stack.tsx
2. [ ] Verify all tracking events are MCA-relevant
3. [ ] Consider custom Sentry project name (via env var)

### Key Files

| File | Changes Needed |
|------|---------------|
| [apps/website/src/app/layout.tsx](apps/website/src/app/layout.tsx) | OG images, preconnect URLs |
| [apps/website/src/components/header.tsx](apps/website/src/components/header.tsx) | Logo branding |
| [apps/website/src/components/footer.tsx](apps/website/src/components/footer.tsx) | Social links, status page |
| [apps/website/src/components/startpage.tsx](apps/website/src/components/startpage.tsx) | Video URLs, Midday copy |
| [apps/website/src/app/policy/page.tsx](apps/website/src/app/policy/page.tsx) | Support email |
| [apps/website/src/app/terms/page.tsx](apps/website/src/app/terms/page.tsx) | Support/DMCA emails |
| [apps/dashboard/src/app/[locale]/layout.tsx](apps/dashboard/src/app/[locale]/layout.tsx) | OG images |
| [apps/dashboard/src/components/login-video-background.tsx](apps/dashboard/src/components/login-video-background.tsx) | Video poster/source |
| [apps/dashboard/src/components/system-banner.tsx](apps/dashboard/src/components/system-banner.tsx) | Status page URL |
| [apps/dashboard/src/components/favicon-stack.tsx](apps/dashboard/src/components/favicon-stack.tsx) | UTM source |

---

## AGGREGATED ACTION ITEMS

### Phase 0: Immediate (Infrastructure)
1. [ ] Rename Fly.io worker app
2. [ ] Update Cloudflare routes
3. [ ] Update GitHub Actions domain aliases
4. [ ] Fix Supabase auth redirect URLs

### Phase 1: Namespace Migration
1. [ ] Global rename @midday/* → @abacus/*
2. [ ] Update all package.json files
3. [ ] Update turbo.json
4. [ ] Test build

### Phase 2: Domain Model
1. [ ] Create MCA tables migration
2. [ ] Rename customers → merchants
3. [ ] Update API routes
4. [ ] Update UI components

### Phase 3: Feature Transformation
1. [ ] Remove tracker features
2. [ ] Transform invoices → MCAs
3. [ ] Build collections console
4. [ ] Add letter generation

### Phase 4: New Features
1. [ ] Risk scoring
2. [ ] Weekly summaries
3. [ ] Merchant portal
4. [ ] Broker portal

---

## SESSION 12: Email & Notifications
**Analyzed by**: Email Templates & Notifications Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] packages/email/emails/ - All email templates
- [x] packages/email/components/ - Footer, logo, branding
- [x] Invoice-focused templates (deletion/repurpose candidates)
- [x] packages/notifications/ - All notification types
- [x] Sender addresses and "from" names
- [x] MCA-specific emails needed

### Findings

#### 1. Email Templates Inventory (17 files)

**Location**: `packages/email/emails/`

| Template | Purpose | Midday Branding | MCA Action |
|----------|---------|-----------------|------------|
| `welcome.tsx` | New user welcome | ✅ **Already Abacus** | Keep |
| `trial-expiring.tsx` | Trial ending reminder | ✅ **Already Abacus** | Keep |
| `api-key-created.tsx` | API key notification | ❌ "Midday API Key", "The Midday Team" | Update |
| `app-installed.tsx` | App integration added | ❌ "on Midday", "Midday Labs AB" | Update |
| `connection-expire.tsx` | Bank connection expiring | ❌ "Midday", `go.midday.ai` link | Update |
| `connection-issue.tsx` | Bank disconnected | ❌ "Midday", `go.midday.ai` link | Update |
| `get-started.tsx` | Onboarding guide | ❌ "Pontus & Viktor", freelancer features | **Rewrite** |
| `invite.tsx` | Team invitation | ❌ "Midday" hardcoded (2x) | Update |
| `trial-ended.tsx` | Trial expired | ❌ "Midday" (4x), "Pontus & Viktor" | Update |
| `invoice.tsx` | Invoice to customer | ⚠️ Default: "Midday" | Transform → MCA |
| `invoice-paid.tsx` | Invoice paid notification | ⚠️ Links updated, footer old | Transform → Payment Received |
| `invoice-overdue.tsx` | Invoice overdue alert | ⚠️ Links updated, footer old | Transform → Payment Overdue |
| `invoice-reminder.tsx` | Payment reminder | ⚠️ Default: "Midday" | Transform → Collection Reminder |
| `upcoming-invoices.tsx` | Recurring invoice reminder | ⚠️ Footer old | Transform → Scheduled Payments |
| `transactions.tsx` | Weekly transaction summary | ⚠️ Footer old | **Excellent** → Portfolio Summary |
| `transactions-exported.tsx` | Transactions shared | ⚠️ Default: "Midday" | Keep |
| `app-review-request.tsx` | Admin app review | ⚠️ Footer old | Keep |

#### 2. Email Branding Components

**Logo Component** (`packages/email/components/logo.tsx`):
- Line 40: `alt="Midday"` → Should be `alt="Abacus"`
- Uses dynamic `baseUrl` for image source

**Logo Footer** (`packages/email/components/logo-footer.tsx`):
- Line 39: `alt="Midday"` → Should be `alt="Abacus"`

**Footer Component** (`packages/email/components/footer.tsx`):
- Line 233: `"Midday Labs AB - Torsgatan 59 113 37, Stockholm, Sweden."` → **UPDATE TO ABACUS**
- Line 33: Tagline `"Run your business smarter."` → Consider MCA-specific
- **20+ hardcoded `go.midday.ai` shortlinks** to Midday pages:
  - Features: Overview, Inbox, Vault, Tracker, Invoice, Pricing, Download
  - Resources: Homepage, Github (`git.new/midday`), Support, Terms, Privacy
  - Company: Story, Updates, Open startup, OSS Friends
  - Social: X (Twitter), Product Hunt, LinkedIn
- Line 238: Notification preferences → ✅ Already `app.abacuslabs.co`

**Get Started Button** (`packages/email/components/get-started.tsx`):
- Link: `https://go.midday.ai/VmJhYxE` → Update

#### 3. Sender Addresses & "From" Names

| Location | Current Sender | Status |
|----------|----------------|--------|
| `packages/notifications/.../email-service.ts:141` | `"Abacus <noreply@abacuslabs.co>"` | ✅ Correct |
| `packages/jobs/src/tasks/team/invite.ts:20` | `"Abacus <noreply@abacuslabs.co>"` | ✅ Correct |
| `packages/jobs/src/tasks/team/onboarding.ts:45` | `"Pontus from Midday <pontus@midday.ai>"` | ❌ **UPDATE** |
| `packages/notifications/.../invoice-sent.ts:34` | `"{team.name} <middaybot@midday.ai>"` | ❌ **UPDATE** |
| `packages/notifications/.../transactions-exported.ts:27` | `"{team.name} <middaybot@midday.ai>"` | ❌ **UPDATE** |

#### 4. Notification Types Inventory (22 types)

**Location**: `packages/notifications/src/types/`

##### Invoice-Focused (9 types - TRANSFORM for MCA):
| Type | Current Purpose | MCA Transformation |
|------|-----------------|-------------------|
| `invoice_paid` | Invoice marked paid | → `payment_received` |
| `invoice_overdue` | Invoice past due | → `payment_overdue` |
| `invoice_sent` | Invoice emailed | → `payment_link_sent` |
| `invoice_reminder_sent` | Payment reminder | → `collection_reminder_sent` |
| `invoice_created` | Invoice created (in-app) | → `advance_created` |
| `invoice_scheduled` | Invoice scheduled | → DELETE (no recurring MCA) |
| `invoice_cancelled` | Invoice cancelled | → `advance_cancelled` |
| `invoice_refunded` | Invoice refunded | → `advance_refund_issued` |
| `recurring_invoice_upcoming` | Upcoming recurring invoices | → `balloon_payment_due` |

##### Transaction/Inbox (7 types - KEEP, MCA-relevant):
- `transactions_created` - New bank transactions synced
- `transactions_exported` - Transactions shared externally
- `transactions_categorized` - AI categorized transactions
- `transactions_assigned` - Transaction assigned to user
- `inbox_new` - New documents in inbox
- `inbox_auto_matched` - Auto-matched to transactions
- `inbox_needs_review` - Manual review needed

##### Recurring/Document (6 types):
- `recurring_series_completed`, `recurring_series_started`, `recurring_series_paused` - REMOVE
- `document_uploaded`, `document_processed` - KEEP

#### 5. MCA-Specific Emails & Notifications NEEDED

**High Priority (P0):**
| Name | Purpose | Channels |
|------|---------|----------|
| `nsf_alert` | Non-Sufficient Funds on payment attempt | Email + In-app + Slack |
| `late_payment_alert` | Payment received X days late | Email + In-app |
| `payment_received` | Payment successfully posted | Email + In-app |
| `weekly_portfolio_summary` | Portfolio health digest | Email |
| `merchant_needs_attention` | Bundled alert (overdue, NSF, risk) | Email + In-app |

**Medium Priority (P1):**
| Name | Purpose | Channels |
|------|---------|----------|
| `risk_score_changed` | Merchant risk score changed | Email + In-app |
| `stacking_detected` | Merchant has multiple MCAs | Email + In-app |
| `balance_threshold_alert` | Bank balance dropped below threshold | Email + In-app |
| `collection_reminder` | Payment due soon reminder | Email |
| `advance_funded` | MCA funded to merchant | Email + In-app |

**Low Priority (P2):**
- `monthly_portfolio_report` - Monthly performance summary
- `merchant_document_request` - KYC document request
- `balloon_payment_due` - Final payment approaching

#### 6. Notification Batching Pattern

Current implementation supports batching (only `inbox_new` uses it):
- Groups notifications within 5-minute window
- Single activity instead of multiple

**Recommended for MCA:**
- Batch daily late payments → "3 merchants late today"
- Batch NSF alerts → "5 failed payments this week"
- Weekly digest → All portfolio alerts summarized

### Summary

| Category | Total | Needs Update | Already Abacus |
|----------|-------|--------------|----------------|
| Email Templates | 17 | 15 | 2 |
| Footer Links | 20+ | 20+ | 0 |
| Sender Addresses | 5 | 3 | 2 |
| Notification Types | 22 | 9 (transform) + 3 (remove) | 10 |
| Logo Alt Text | 2 | 2 | 0 |

### Action Items

#### Phase 1: Critical Branding (P0)
1. [ ] Update `logo.tsx` and `logo-footer.tsx` alt text to "Abacus"
2. [ ] Replace `footer.tsx` company address (Midday Labs AB → Abacus)
3. [ ] Update 3 sender addresses from `@midday.ai` to `@abacuslabs.co`:
   - `packages/jobs/src/tasks/team/onboarding.ts:45`
   - `packages/notifications/src/types/invoice-sent.ts:34`
   - `packages/notifications/src/types/transactions-exported.ts:27`
4. [ ] Rewrite `get-started.tsx` email for MCA onboarding (remove freelancer features)
5. [ ] Update `trial-ended.tsx` from "Pontus & Viktor" to "The Abacus Team"

#### Phase 2: Footer Links (P1)
1. [ ] Create Abacus shortlinks or direct URLs to replace 20+ `go.midday.ai` links
2. [ ] Update GitHub link from `git.new/midday` to Abacus repo
3. [ ] Update social links to Abacus accounts (or remove if not created)
4. [ ] Consider simplifying footer for MCA context (remove Vault, Tracker, etc.)

#### Phase 3: Notification Transformation (P2)
1. [ ] Rename invoice notification types to MCA terminology
2. [ ] Remove recurring series notifications (3 types)
3. [ ] Create NSF alert notification handler
4. [ ] Create weekly portfolio summary notification
5. [ ] Update email templates to match new notification types

#### Phase 4: New MCA Notifications (P3)
1. [ ] Build `nsf_alert` notification with Slack integration
2. [ ] Build `weekly_portfolio_summary` scheduled job
3. [ ] Build `risk_score_changed` notification
4. [ ] Implement notification batching for daily summaries

### Key Files

| File | Changes Needed |
|------|---------------|
| [packages/email/components/logo.tsx](packages/email/components/logo.tsx) | Alt text "Midday" → "Abacus" |
| [packages/email/components/logo-footer.tsx](packages/email/components/logo-footer.tsx) | Alt text "Midday" → "Abacus" |
| [packages/email/components/footer.tsx](packages/email/components/footer.tsx) | Company address + 20+ links |
| [packages/email/emails/get-started.tsx](packages/email/emails/get-started.tsx) | Full rewrite for MCA |
| [packages/email/emails/trial-ended.tsx](packages/email/emails/trial-ended.tsx) | Signature + 4 Midday refs |
| [packages/email/emails/api-key-created.tsx](packages/email/emails/api-key-created.tsx) | Default name + signature |
| [packages/email/emails/invite.tsx](packages/email/emails/invite.tsx) | 2 hardcoded "Midday" refs |
| [packages/jobs/src/tasks/team/onboarding.ts](packages/jobs/src/tasks/team/onboarding.ts) | Sender email address |
| [packages/notifications/src/types/invoice-sent.ts](packages/notifications/src/types/invoice-sent.ts) | Sender domain |
| [packages/notifications/src/types/transactions-exported.ts](packages/notifications/src/types/transactions-exported.ts) | Sender domain |
| [packages/notifications/src/notification-types.ts](packages/notifications/src/notification-types.ts) | Add MCA notification types |

---

## SESSION 13: Pricing & Monetization
**Analyzed by**: Pricing, Plans & Monetization Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] Stripe integration - apps/api and packages/plans
- [x] Current plan definitions (starter, pro) - packages/plans/src/index.ts
- [x] Feature gates and limits - what metrics are used
- [x] Pricing pages - apps/website and dashboard billing UI
- [x] Legacy Polar code that should be removed

### Findings

#### 1. Current Pricing (✅ Already Updated)

**Good News**: Pricing has ALREADY been updated from legacy freelancer pricing ($29/$49) to MCA-appropriate pricing:

| Plan | Monthly Price | Stripe Price ID | Product ID |
|------|---------------|-----------------|------------|
| **Starter** | $399/month | `price_1StV2sPhqDnZkVAwx5F3Vji6` | `prod_TrDTsDNm2Vw2rt` |
| **Pro** | $499/month | `price_1StV33PhqDnZkVAwT0Mzi8Y6` | `prod_TrDTedpbB0YW3v` |

**Source**: [packages/plans/src/index.ts:34-51](packages/plans/src/index.ts)

Pricing can be overridden via environment variables:
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`

#### 2. Plan Limits are FREELANCER-FOCUSED ⚠️

**Current limits in `getPlanLimits()`** ([packages/plans/src/index.ts:128-156](packages/plans/src/index.ts)):

| Metric | Starter | Pro | MCA Relevance |
|--------|---------|-----|---------------|
| `users` | 1 | 10 | ✅ Keep |
| `bankConnections` | 1 | 10 | ✅ Keep |
| `storage` | 10GB | 100GB | ✅ Keep |
| `inbox` | 50 | 500 | ⚠️ Less relevant |
| `invoices` | 10 | 30 | ❌ **Should be `merchants`** |

**Missing MCA Metrics**:
- `merchants` - Number of merchants in portfolio
- `activeAdvances` - Number of active MCAs
- `monthlyVolume` - Total funding volume
- `riskAlerts` - Number of risk alerts/month

#### 3. Feature Gates NOT ENFORCED ⚠️

**Critical Finding**: Plan limits are displayed in UI but **NOT enforced at the API level**:

| Gate Point | Current Status |
|------------|----------------|
| Creating invoices | ❌ Not blocked at limit |
| Adding team members | ❌ Not blocked at limit |
| Adding bank connections | ❌ Not blocked at limit |
| Sync operations | ✅ **ONLY gate that works** (30-day trial window) |

**Sync Eligibility** ([apps/dashboard/src/utils/check-team-eligibility.ts:1-30](apps/dashboard/src/utils/check-team-eligibility.ts)):
- Pro/Starter: Always eligible
- Trial: Only eligible if created within 30 days

**Plan Availability Check** ([packages/db/src/queries/teams.ts:508-540](packages/db/src/queries/teams.ts)):
- Starter: Available if ≤2 users AND ≤2 bank connections
- Pro: Always available

#### 4. Stripe Integration Architecture (✅ Solid)

**Billing Router** ([apps/api/src/trpc/routers/billing.ts](apps/api/src/trpc/routers/billing.ts)):
| Procedure | Purpose |
|-----------|---------|
| `createCheckout` | Creates Stripe Checkout Session |
| `getPortalUrl` | Customer billing portal access |
| `orders` | List invoices with pagination |
| `getSubscription` | Current subscription details |

**Webhook Handler** ([apps/api/src/rest/routers/webhooks/stripe/index.ts](apps/api/src/rest/routers/webhooks/stripe/index.ts)):
| Event | Handler |
|-------|---------|
| `checkout.session.completed` | Activates subscription |
| `customer.subscription.updated` | Plan changes, cancellation scheduling |
| `customer.subscription.deleted` | Downgrades to trial |
| `invoice.payment_failed` | Marks past_due |
| `invoice.paid` | Restores active status |

**Database Fields** ([packages/db/src/schema.ts:1585-1592](packages/db/src/schema.ts)):
- `plan`: enum("trial", "starter", "pro")
- `subscriptionStatus`: enum("active", "past_due")
- `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`

#### 5. Pricing Pages

**Website Pricing** ([apps/website/src/components/sections/pricing-section.tsx](apps/website/src/components/sections/pricing-section.tsx)):
- Shows $399 Starter, $499 Pro ✅
- Features listed are FREELANCER-focused (invoices, time tracking)
- 30-day free trial messaging

**Dashboard Plans** ([apps/dashboard/src/components/plans.tsx](apps/dashboard/src/components/plans.tsx)):
- Starter: 10 invoices, 2 banks, 50 inbox, 10GB, 2 users
- Pro: 50 invoices, 10 banks, 500 inbox, 100GB, 10 users
- Disables Starter if user exceeds limits

**V2 Pricing Section** ([apps/website/src/components/sections/pricing-section-v2.tsx](apps/website/src/components/sections/pricing-section-v2.tsx)):
- ⚠️ Contains OLD pricing ($29/$79/$129) - **NOT ACTIVE, DELETE OR IGNORE**

#### 6. LEGACY POLAR CODE TO REMOVE 🔴

Polar was the original payment processor before Stripe. Legacy code remains:

| File | Status | Action |
|------|--------|--------|
| [apps/api/src/utils/polar.ts](apps/api/src/utils/polar.ts) | SDK initialized | **DELETE** |
| [apps/api/src/rest/routers/webhooks/polar/index.ts](apps/api/src/rest/routers/webhooks/polar/index.ts) | **ACTIVE webhook** (215 lines) | **DELETE** |
| [apps/api/src/schemas/polar.ts](apps/api/src/schemas/polar.ts) | Schema unused | **DELETE** |
| [packages/app-store/src/polar/config.ts](packages/app-store/src/polar/config.ts) | `active: false` | **DELETE** |
| [packages/plans/src/index.ts:5-81](packages/plans/src/index.ts) | Legacy Polar plans | **DELETE** |

**Polar Webhook Still Mounted!** ([apps/api/src/rest/routers/webhooks/index.ts:16](apps/api/src/rest/routers/webhooks/index.ts))
- Handles subscription events but Polar is not in use
- Security risk: Unauthenticated webhook endpoint

**Polar Environment Variables** (in `.env-template` and `.env-example`):
```
POLAR_ACCESS_TOKEN=
POLAR_ENVIRONMENT=sandbox
POLAR_WEBHOOK_SECRET=
```

#### 7. Usage Display Component

**Location**: [apps/dashboard/src/components/usage.tsx:1-166](apps/dashboard/src/components/usage.tsx)

Currently shows:
- Users (current/max)
- Bank connections (current/max)
- Inbox items this month (current/max)
- Invoices created this month (current/max)

**Should show for MCA**:
- Merchants (current/max)
- Active advances (current/max)
- Bank connections (current/max)
- Users (current/max)

### Summary

| Area | Status | Priority |
|------|--------|----------|
| Stripe integration | ✅ Working well | - |
| Pricing amounts | ✅ Updated ($399/$499) | - |
| Plan limits | ⚠️ Freelancer metrics (invoices, inbox) | P1 |
| Feature enforcement | ❌ Not enforced at API | P2 |
| Polar cleanup | ❌ Legacy code remains | P0 |
| Usage display | ⚠️ Shows freelancer metrics | P1 |
| V2 pricing page | ⚠️ Old pricing, delete | P2 |

### Action Items

#### Phase 1: Polar Cleanup (P0)
1. [ ] Remove webhook route from `apps/api/src/rest/routers/webhooks/index.ts`
2. [ ] Delete `apps/api/src/rest/routers/webhooks/polar/index.ts`
3. [ ] Delete `apps/api/src/utils/polar.ts`
4. [ ] Delete `apps/api/src/schemas/polar.ts`
5. [ ] Delete `packages/app-store/src/polar/` directory
6. [ ] Remove legacy Polar plans from `packages/plans/src/index.ts:5-81`
7. [ ] Remove Polar env vars from `.env-template` and `.env-example`

#### Phase 2: Plan Limits Migration (P1)
1. [ ] Update `getPlanLimits()` to use MCA metrics:
   - Change `invoices` → `merchants`
   - Consider adding `activeAdvances`, `monthlyVolume`
2. [ ] Update `getAvailablePlans()` to check merchant count
3. [ ] Update `usage.tsx` to display MCA metrics
4. [ ] Update feature lists in `plans.tsx` and `pricing-section.tsx`

#### Phase 3: Feature Enforcement (P2)
1. [ ] Add API-level limit checks for merchant creation
2. [ ] Add limit checks for bank connection creation
3. [ ] Add team member limit enforcement
4. [ ] Create upgrade prompts when limits reached

#### Phase 4: Cleanup (P3)
1. [ ] Delete `pricing-section-v2.tsx` (contains old pricing)
2. [ ] Update pricing page features for MCA terminology
3. [ ] Remove freelancer-specific features from plan descriptions

### Key Files

| File | Changes Needed |
|------|---------------|
| [packages/plans/src/index.ts](packages/plans/src/index.ts) | Delete Polar code (lines 5-81), update limits |
| [apps/api/src/rest/routers/webhooks/index.ts](apps/api/src/rest/routers/webhooks/index.ts) | Remove Polar webhook import |
| [apps/api/src/rest/routers/webhooks/polar/index.ts](apps/api/src/rest/routers/webhooks/polar/index.ts) | DELETE entire file |
| [apps/api/src/utils/polar.ts](apps/api/src/utils/polar.ts) | DELETE entire file |
| [apps/api/src/schemas/polar.ts](apps/api/src/schemas/polar.ts) | DELETE entire file |
| [packages/app-store/src/polar/](packages/app-store/src/polar/) | DELETE entire directory |
| [apps/dashboard/src/components/usage.tsx](apps/dashboard/src/components/usage.tsx) | Update to MCA metrics |
| [apps/dashboard/src/components/plans.tsx](apps/dashboard/src/components/plans.tsx) | Update feature list |
| [apps/website/src/components/sections/pricing-section.tsx](apps/website/src/components/sections/pricing-section.tsx) | Update features |
| [apps/website/src/components/sections/pricing-section-v2.tsx](apps/website/src/components/sections/pricing-section-v2.tsx) | DELETE (old pricing) |
| [packages/db/src/queries/teams.ts](packages/db/src/queries/teams.ts) | Update getAvailablePlans |

---

## SESSION 14: Documentation & Help Content
**Analyzed by**: Documentation & Help Content Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] apps/docs/ - Documentation site structure and content
- [x] In-app help text and tooltips across dashboard
- [x] Onboarding flows and welcome screens
- [x] README.md files across all packages
- [x] CLAUDE.md and other AI/agent configuration
- [x] Content referencing freelancer workflows or Midday

### Findings

#### 1. Documentation Site (`apps/docs/`)

**Framework**: Mintlify (modern, API-first documentation)
**Development**: `mintlify dev --port 3004`

**Structure:**
```
apps/docs/
├── api-reference/engine/
│   ├── endpoint/  (24 API endpoint files)
│   └── introduction.mdx
├── examples.mdx
├── integrations.mdx
├── introduction.mdx
├── local-development.mdx
├── mcp.mdx
├── self-hosting.mdx
├── mint.json (configuration)
└── logos/, images/ (branding assets)
```

**25 Midday References Found (across 8 files):**

| File | Instances | Priority | Content |
|------|-----------|----------|---------|
| `mint.json` | 8 | **CRITICAL** | Site name, support email, OpenAPI URL, social links |
| `introduction.mdx` | 4 | **CRITICAL** | OG title, description, alt text |
| `local-development.mdx` | 8 | HIGH | Multiple setup references, git clone URL |
| `self-hosting.mdx` | 3 | HIGH | Title, OG title, description |
| `examples.mdx` | 2 | HIGH | OG title, description |
| `integrations.mdx` | 2 | HIGH | OG title, description |
| `api-reference/engine/introduction.mdx` | 1 | MEDIUM | Auth description |
| `package.json` | 1 | MEDIUM | Package name `@midday/docs` |

**✅ MCP Documentation Already Updated**: `mcp.mdx` properly references "Abacus" throughout

**Specific Issues in `mint.json`:**
- Line 3: `"name": "Midday.ai Docs"` → `"Abacus Docs"`
- Line 26: `"url": "mailto:support@midday.ai"` → `support@abacuslabs.co`
- Line 33: `"openapi": "https://engine.midday.ai/openapi"` → engine.abacuslabs.co
- Lines 49, 92-95: GitHub/social links to Midday accounts

**Specific Issues in `local-development.mdx`:**
- Line 79: `"First, clone the [midday.ai repo]..."`
- Line 82: `https://github.com/midday-ai/midday.git` → Abacus repo

#### 2. In-App Help Content (`apps/dashboard/`)

**Empty State Components (Well-Structured, Clean):**

| Component | Location | Content Status |
|-----------|----------|----------------|
| Invoices | `components/tables/invoices/empty-states.tsx` | ✅ Generic |
| Customers | `components/tables/customers/empty-states.tsx` | ✅ Generic |
| Transactions | `components/tables/transactions/empty-states.tsx` | ✅ MCA-appropriate |
| Tracker | `components/tables/tracker/empty-states.tsx` | ⚠️ Freelancer feature |
| Vault | `components/vault/empty-states.tsx` | ✅ Generic |
| API Keys | `components/tables/api-keys/empty-state.tsx` | ✅ Generic |
| Notifications | `components/notification-center/empty-state.tsx` | ✅ Generic |

**Onboarding Flows:**
- `src/app/[locale]/(app)/setup/page.tsx` - Account setup (name, avatar)
- `src/components/setup-form.tsx` - Basic profile form
- `src/components/setup-mfa.tsx` - MFA setup

**Support Forms:**
- `src/components/feedback-form.tsx` - Ideas/issues feedback
- `src/components/support-form.tsx` - Product support with categories

**Localization:**
- `src/locales/en.ts` - All UI strings (✅ No "Midday" or freelancer references)
- `src/locales/sv.ts` - Swedish translation

**❌ NOT Present (Opportunities):**
- No dedicated tooltip components
- No "How it works" educational modals
- No welcome screen/tour component
- No "Learn more" links to documentation
- No video tutorials or animated guides

#### 3. README Files Across Packages

**29 Packages Using `@midday/*` Namespace:**

All package.json files use `@midday/*` naming:
```
@midday/accounting   @midday/email        @midday/invoice
@midday/app-store    @midday/encryption   @midday/jobs
@midday/cache        @midday/engine-client @midday/logger
@midday/categories   @midday/events       @midday/notifications
@midday/customers    @midday/import       @midday/plans
@midday/db           @midday/inbox        @midday/queue
@midday/documents    etc...
```

**README Quality Assessment:**

| Quality | Location | Notes |
|---------|----------|-------|
| ⭐⭐⭐ Detailed | `packages/accounting/README.md` | Full docs but Midday-focused |
| ⭐⭐⭐ Detailed | `packages/categories/README.md` | Tax system docs |
| ⭐⭐ Partial | `packages/inbox/README.md` | Generic description |
| ⭐ Minimal | `packages/ui/README.md` | Single line: "### UI" |
| ⭐ Minimal | `packages/jobs/README.md` | Single line: "### Jobs" |
| ⭐ Minimal | `apps/dashboard/README.md` | Single line: "## Dashboard" |
| ⭐ Minimal | `apps/website/README.md` | Single line: "### Website" |
| ⭐ Minimal | `apps/api/README.md` | Only Redis config |
| ⭐ Minimal | `apps/engine/README.md` | Logo/CDN info only |
| ⭐ Minimal | `apps/docs/README.md` | Empty |

**Detailed README Issues:**

`packages/accounting/README.md`:
- Line 3: "Technical documentation for Midday's accounting software integrations"
- Line 22: "The accounting integration enables Midday users..."
- References `@midday/db`, `@midday/worker`, `@midday/accounting`

`packages/inbox/README.md`:
- Line 1: "# @midday/inbox"
- Generic email description (could emphasize MCA document collection)

`docs/README.md`:
- Line 3: "This directory contains technical documentation for the Midday."
- References "recurring invoice system", "inbox matching algorithm" (freelancer features)

#### 4. Root Documentation Status

| File | Status | Notes |
|------|--------|-------|
| `README.md` | ✅ **Already MCA-focused** | Complete rewrite done |
| `PRODUCT_VISION.md` | ✅ **Already MCA-focused** | Full MCA product documentation |
| `CLAUDE.md` | ✅ **Already MCA-focused** | AI agent guide with MCA context |
| `CONTRIBUTING.md` | ❌ Missing | Consider creating |
| `CHANGELOG.md` | ❌ Missing | Consider creating |

#### 5. API Reference Documentation

**Location**: `apps/docs/api-reference/engine/`
- 24 endpoint files (auto-generated from OpenAPI spec)
- Will update automatically when OpenAPI spec at `engine.midday.ai/openapi` is updated
- Only `introduction.mdx` has hardcoded Midday reference (line 30)

### Summary

| Category | Files | Midday Refs | Priority |
|----------|-------|-------------|----------|
| Docs site config | 2 | 9 | **P0** |
| Docs site content | 6 | 16 | **P1** |
| Package READMEs | 11+ | ~20 | **P2** |
| App READMEs | 6 | 0 | **P3** (sparse) |
| Dashboard help | 15+ | 0 | ✅ Clean |
| Root docs | 3 | 0 | ✅ Clean |

### Action Items

#### Phase 1: Critical Docs Site Updates (P0)
1. [ ] Update `apps/docs/mint.json`:
   - Site name: "Midday.ai Docs" → "Abacus Docs"
   - Support email: `support@midday.ai` → `support@abacuslabs.co`
   - OpenAPI URL: `engine.midday.ai` → `engine.abacuslabs.co`
   - GitHub/social links to Abacus accounts
2. [ ] Update `apps/docs/introduction.mdx` OG metadata
3. [ ] Update `apps/docs/package.json` name: `@midday/docs` → `@abacus/docs`

#### Phase 2: Docs Site Content (P1)
1. [ ] Update `local-development.mdx`:
   - Change 8 "Midday" references
   - Update git clone URL to Abacus repo
2. [ ] Update `self-hosting.mdx` title and metadata
3. [ ] Update `examples.mdx` and `integrations.mdx` metadata
4. [ ] Update `api-reference/engine/introduction.mdx` auth description

#### Phase 3: Package Documentation (P2)
1. [ ] Rewrite `packages/accounting/README.md` for MCA payment reconciliation
2. [ ] Rewrite `packages/inbox/README.md` for MCA document collection
3. [ ] Update `docs/README.md` to remove freelancer feature references
4. [ ] Add content to sparse READMEs (ui, jobs, dashboard, website, api, engine)

#### Phase 4: Documentation Enhancements (P3)
1. [ ] Create `CONTRIBUTING.md` with MCA development guidelines
2. [ ] Add in-app help tooltips for MCA-specific concepts:
   - Factor Rate, RTR, NSF, ISO, Stacking
3. [ ] Consider onboarding tour for new MCA operators
4. [ ] Add "Learn more" links from dashboard to docs

### Key Files

| File | Changes Needed |
|------|---------------|
| [apps/docs/mint.json](apps/docs/mint.json) | Site name, emails, URLs, social links (9 refs) |
| [apps/docs/introduction.mdx](apps/docs/introduction.mdx) | OG metadata (4 refs) |
| [apps/docs/local-development.mdx](apps/docs/local-development.mdx) | Setup guide (8 refs) |
| [apps/docs/self-hosting.mdx](apps/docs/self-hosting.mdx) | Title, metadata (3 refs) |
| [apps/docs/examples.mdx](apps/docs/examples.mdx) | OG metadata (2 refs) |
| [apps/docs/integrations.mdx](apps/docs/integrations.mdx) | OG metadata (2 refs) |
| [apps/docs/api-reference/engine/introduction.mdx](apps/docs/api-reference/engine/introduction.mdx) | Auth description (1 ref) |
| [packages/accounting/README.md](packages/accounting/README.md) | Full rewrite for MCA |
| [packages/inbox/README.md](packages/inbox/README.md) | MCA document collection focus |
| [docs/README.md](docs/README.md) | Remove freelancer feature references |

---

## SESSION 15: Localization & Internationalization
**Analyzed by**: Localization & i18n Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] packages/email/locales/translations.ts - email translations
- [x] i18n configuration in apps/dashboard and apps/website
- [x] Hardcoded strings containing "Midday" that need translation
- [x] Date/currency formatting utilities
- [x] Language/locale support scope
- [x] next-intl or similar i18n libraries

### Findings

#### 1. i18n Framework Architecture

**Primary Library**: `next-international` (v1.3.1)

| Feature | Implementation |
|---------|---------------|
| Framework | `next-international` for Next.js |
| Routing Strategy | URL rewrite (`/[locale]/(app)/...`) |
| Default Locale | `"en"` |
| Active Locales | English only (Swedish commented out) |
| Translation Pattern | Static imports with `useI18n()` / `useScopedI18n()` hooks |

**Key Configuration Files**:
- `apps/dashboard/src/locales/client.ts` - Client-side i18n setup
- `apps/dashboard/src/locales/server.ts` - Server-side i18n setup
- `apps/dashboard/src/middleware.ts` - Locale routing middleware
- `apps/dashboard/src/locales/en.ts` - English translations (~600+ keys)
- `apps/dashboard/src/locales/sv.ts` - Swedish translations (100% complete, commented out)

#### 2. Translation Systems (Two Separate Systems)

##### Dashboard Translations (`apps/dashboard/src/locales/`)
- **Scale**: ~600+ translation keys
- **Format**: Nested TypeScript objects with dot notation
- **Categories**: UI labels, transaction methods, notification messages, categories, statuses, roles

**Example Key Structure**:
```typescript
transaction_methods: { card_purchase, payment, card_atm, ... }
language: { title, description, placeholder }
notifications: { ... complex nested notification types }
transaction_categories: { ... 60+ category types with descriptions }
```

##### Email Translations (`packages/email/locales/`)
- **Scale**: ~30+ email template translations
- **Format**: Function-based with `switch(locale)` pattern
- **Supported**: English + Swedish (both active)
- **Location**: `packages/email/locales/translations.ts`

**Note**: File has TODO suggesting migration to `@languine/react-email`

#### 3. Language Support Status

| Language | Dashboard | Email | UI Status |
|----------|-----------|-------|-----------|
| English (en) | ✅ Active | ✅ Active | Enabled |
| Swedish (sv) | ✅ Ready | ✅ Ready | **Commented out** |

**To Enable Swedish**:
```typescript
// In client.ts and server.ts, uncomment:
sv: () => import("./sv"),
// In middleware.ts, change:
locales: ["en", "sv"],
```

#### 4. Locale vs. Language Distinction

The system distinguishes between:
- **Language**: UI text language (en/sv translations)
- **Locale**: Regional formatting preferences (currency, date, timezone)

**User Locale Settings** (`apps/dashboard/src/components/locale-settings.tsx`):
- 195+ countries with default locales from `@midday/location/countries-intl`
- Each country has: `default_locale`, `currency`, timezone
- Stored in user profile, separate from UI language

#### 5. Hardcoded "Midday" Strings - Comprehensive Audit

**Total**: 115 files with "Midday" references

##### 🔴 CRITICAL - User-Visible UI (Priority P0)

| Category | File Count | Examples |
|----------|------------|----------|
| **Dashboard UI** | 20 | Settings descriptions, modals, OAuth screens |
| **Email Templates** | 30 | Subjects, body text, signatures |
| **Website Copy** | 45 | Marketing, legal pages, meta tags |

**Dashboard Strings Requiring Update**:
| File | Line | Current Text |
|------|------|--------------|
| `change-theme.tsx` | 16 | `"Customize how Midday looks on your device."` |
| `company-name.tsx` | 49 | `"within Midday. For example,"` |
| `delete-account.tsx` | 53 | `"the Midday platform"` |
| `delete-team.tsx` | 62 | `"from the Midday"` |
| `choose-plan-modal.tsx` | 44,54 | `"continue using Midday"` |
| `upgrade-content.tsx` | 51-56 | `"Unlock full access to Midday"` |
| `connect-transactions-modal.tsx` | 134 | `clientName: "Midday"` |
| `oauth-consent-screen.tsx` | 181,211 | `"Midday."`, `"verified by Midday yet"` |
| `team-id-section.tsx` | 26,36 | `"within Midday"`, `"Midday API"` |
| `app.tsx` | 158,235 | `"Published by Midday"`, App Store description |
| `unified-app.tsx` | 392,514 | `"By Midday"`, App Store disclaimer |

**Email Translations Requiring Update** (`packages/email/locales/translations.ts`):
- Line 46: `"invite.subject": "...on Midday"`
- Line 47: `"invite.preview": "Join ${teamName} on Midday"`
- Lines 107-108: Swedish translations with same pattern

##### 🟡 HIGH - API Bot Messages (Priority P1)

| Integration | Occurrences | Example |
|-------------|-------------|---------|
| Slack | 10+ | `"I'm your new *Midday* bot"`, `"View in Midday"` |
| WhatsApp | 5+ | `"Connect to Midday: ${inboxId}"` |
| PDF Export | 6 | `author: "Midday"`, `creator: "Midday Dashboard"` |

##### 🟠 MEDIUM - Documentation & Comments (Priority P2)

- **apps/docs/**: 14 occurrences (SEO, meta tags, content)
- **Code Comments**: 30+ occurrences across codebase
- **Accounting**: 8 occurrences (`"Synced from Midday"`, `"Midday Expenses"`)

#### 6. Date & Currency Formatting Utilities

##### Libraries Used
| Library | Version | Purpose |
|---------|---------|---------|
| `date-fns` | 4.1.0 | Primary date formatting |
| `@date-fns/tz` | 1.4.1 | Timezone support |
| `@date-fns/utc` | 2.1.1 | UTC handling |
| `Intl.NumberFormat` | Native | Currency formatting |

##### Key Formatting Files
| File | Purpose |
|------|---------|
| [packages/utils/src/format.ts](packages/utils/src/format.ts) | Core: `formatAmount()`, `formatDate()`, `formatCompactAmount()`, `formatRelativeTime()` |
| [apps/dashboard/src/utils/format.ts](apps/dashboard/src/utils/format.ts) | Dashboard: `formatSize()`, `formatAmount()`, `formatAccountName()` |
| [apps/dashboard/src/utils/currency.ts](apps/dashboard/src/utils/currency.ts) | `normalizeCurrencyCode()` - ISO 4217 validation |
| [packages/invoice/src/utils/pdf-format.ts](packages/invoice/src/utils/pdf-format.ts) | `formatCurrencyForPDF()` - Handles react-pdf issues |

##### Locale Awareness Status
- ✅ **Currency formatting**: Locale-aware via user profile
- ✅ **Timezone support**: Uses `@date-fns/tz` with `Intl.DateTimeFormat` validation
- ⚠️ **Default fallback**: All undefined locales → `"en-US"`
- ❌ **Date format strings**: Hardcoded patterns (not locale-aware)

**Hardcoded `en-US` Defaults**:
- `packages/utils/src/format.ts:14` - `locale = "en-US"`
- `apps/dashboard/src/utils/format.ts:35` - `safeLocale = locale ?? "en-US"`
- `apps/dashboard/src/utils/format.ts:202` - `formatCompactAmount()` default

#### 7. MCA-Specific Formatting Gaps

**NOT IMPLEMENTED** (Needed for MCA):
| Formatter | Purpose | Current Status |
|-----------|---------|----------------|
| Factor Rate | Display as "1.35x" | ❌ Not found |
| RTR Amount | Right to Receivables balance | Uses generic `formatAmount()` |
| Payment Schedule | Expected vs. actual display | Uses generic date formatting |
| Collection Status | "Due", "Late", "NSF" badges | Uses text enums only |

#### 8. Website i18n Status

**apps/website/**: No i18n configured
- Hardcoded `locale: "en_US"` in layout.tsx
- No locale routing
- Marketing content is English-only

### Summary

| Category | Status | Action Required |
|----------|--------|-----------------|
| i18n Framework | ✅ Solid architecture | Namespace migration only |
| English Translations | ✅ Complete | Update "Midday" references |
| Swedish Translations | ✅ Ready | Uncomment to enable |
| Email Translations | ⚠️ Partial | Update "Midday" refs + add MCA terms |
| Date Formatting | ✅ Locale-aware | Add MCA-specific patterns |
| Currency Formatting | ✅ Locale-aware | Add factor rate formatter |
| Hardcoded Strings | ❌ 115 files | Systematic update needed |
| Website i18n | ❌ Not configured | Future consideration |

### Action Items

#### Phase 1: Critical Branding (P0)
1. [ ] Update 20 dashboard UI strings containing "Midday" → "Abacus"
2. [ ] Update email translations (invite subject/preview) in `translations.ts`
3. [ ] Update email template hardcoded strings (see Session 12)
4. [ ] Update PDF metadata (`author`, `creator` fields)
5. [ ] Update Slack/WhatsApp bot messages

#### Phase 2: Translation Keys (P1)
1. [ ] Add MCA-specific translation keys to `en.ts`:
   - `mca_status: { funded, active, at_risk, default, paid_off }`
   - `risk_levels: { low, medium, high, critical }`
   - `payment_status: { on_time, late, nsf, missed }`
   - `collection_actions: { reminder, call, letter, legal }`
2. [ ] Add Swedish equivalents to `sv.ts`
3. [ ] Update `transaction_categories` for MCA context

#### Phase 3: Formatting Utilities (P2)
1. [ ] Create `formatFactorRate()` utility (e.g., "1.35x")
2. [ ] Create `formatPaymentFrequency()` (e.g., "Daily ACH", "Weekly")
3. [ ] Consider locale-aware date format strings
4. [ ] Add MCA-specific number formatting (RTR balance display)

#### Phase 4: Enable Multi-Language (P3)
1. [ ] Uncomment Swedish in `client.ts`, `server.ts`, `middleware.ts`
2. [ ] Test Swedish translations across dashboard
3. [ ] Update email locale handling
4. [ ] Consider language selector in settings

### Key Files

| File | Changes Needed |
|------|---------------|
| [apps/dashboard/src/locales/en.ts](apps/dashboard/src/locales/en.ts) | Add MCA translation keys |
| [apps/dashboard/src/locales/sv.ts](apps/dashboard/src/locales/sv.ts) | Add MCA translation keys (Swedish) |
| [apps/dashboard/src/locales/client.ts](apps/dashboard/src/locales/client.ts) | Uncomment `sv` to enable Swedish |
| [apps/dashboard/src/locales/server.ts](apps/dashboard/src/locales/server.ts) | Uncomment `sv` to enable Swedish |
| [apps/dashboard/src/middleware.ts](apps/dashboard/src/middleware.ts) | Add `"sv"` to locales array |
| [packages/email/locales/translations.ts](packages/email/locales/translations.ts) | Update "Midday" → "Abacus" |
| [packages/utils/src/format.ts](packages/utils/src/format.ts) | Add MCA formatting utilities |
| 20 dashboard component files | Update hardcoded "Midday" strings |

---

## SESSION 16: AI Features & Assistant
**Analyzed by**: AI Features Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] apps/api/src/ai/agents/ - AI agents (analytics, customers, invoices, etc.)
- [x] apps/api/src/ai/artifacts/ - AI-generated reports and visualizations
- [x] apps/api/src/ai/tools/ - AI tools and their functions
- [x] apps/api/src/mcp/ - MCP server implementation
- [x] packages/workbench/ - Job queue workbench
- [x] AI assistant UI in dashboard
- [x] Freelancer-specific vs. adaptable for MCA

### Findings

#### 1. AI Agents Architecture (9 Specialist Agents)

**Location**: `apps/api/src/ai/agents/`

Uses **agent routing pattern** with triage agent delegating to specialists:

| Agent | Purpose | MCA Applicability |
|-------|---------|-------------------|
| **Triage** | Routes to specialist agents | ✅ Keep |
| **General** | Greetings, web search, PDF analysis | ✅ Adaptable |
| **Reports** | P&L, cash flow, forecasts | ✅ **HIGHLY RELEVANT** |
| **Analytics** | Health scores, stress tests, predictions | ✅ **HIGHLY RELEVANT** |
| **Operations** | Account balances, documents, transactions | ✅ Adaptable |
| **Transactions** | Transaction querying & analysis | ✅ Adaptable |
| **Invoices** | Invoice management, payment tracking | 🔄 Transform → MCAs |
| **Customers** | Customer data, profitability, CRM | 🔄 Rename → Merchants |
| **Research** | Affordability analysis, decisions | 🔄 Adaptable |
| **TimeTracking** | Time entries, project hours | ❌ **REMOVE** |

#### 2. AI Tools (29 Total)

**Location**: `apps/api/src/ai/tools/`

##### Financial Analysis (HIGHLY MCA-RELEVANT - 14 tools):
- `get-revenue-summary`, `get-expenses`, `get-profit-analysis`, `get-balance-sheet`
- `get-cash-flow`, `get-burn-rate`, `get-runway`, `get-forecast`, `get-growth-rate`
- `get-invoice-payment-analysis` → **MCA payment tracking**
- `get-business-health-score` → **Portfolio health**
- `get-cash-flow-stress-test` → **Portfolio stress testing**
- `get-tax-summary`, `get-metrics-breakdown`

##### Data Retrieval (ADAPTABLE - 9 tools):
- `get-invoices` → Transform to `get-mcas`
- `get-customers` → Transform to `get-merchants`
- Keep: `get-transactions`, `get-account-balances`, `get-bank-accounts`, `get-net-position`, `get-documents`, `get-inbox`, `web-search`

##### Time Tracking (REMOVE - 5 tools):
- `create-tracker-entry`, `get-tracker-entries`, `get-tracker-projects`, `get-timer-status`, `stop-timer`

#### 3. AI Artifacts (15 Visual Components)

| Artifact | MCA Transformation |
|----------|-------------------|
| **revenue** | → Portfolio funded volume trends |
| **cash-flow** | → Collection health |
| **invoice-payment-analysis** | → **MCA payment analysis** |
| **business-health-score** | → **Portfolio health scoring** |
| **cash-flow-stress-test** | → **Portfolio stress testing** |
| profit, burn-rate, runway, balance-sheet, expenses, spending, tax-summary | ❌ Not applicable |

#### 4. MCP Server Implementation (48 Tools)

**Location**: `apps/api/src/mcp/`

- Server named `"midday"` → **RENAME to `"abacus"`**
- 24 granular scopes, REST endpoint at `POST /mcp`

| Category | Tools | Action |
|----------|-------|--------|
| Transactions | 2 | ✅ Keep |
| Invoices | 8 | 🔄 Transform → MCAs |
| Customers | 5 | 🔄 Rename → Merchants |
| Bank/Documents/Reports | 15 | ✅ Keep |
| Time Tracking | 10 | ❌ **REMOVE** |
| Search/Inbox/Tags/Team | 7 | ✅ Keep |

**MCP Resources to Rename**: `midday://` → `abacus://`

#### 5. AI Assistant UI

**Location**: `apps/dashboard/src/components/chat/`

- 10 Chat Components, 40+ pre-built commands, 15 Canvas visualizations
- Tax Rate Assistant with Claude API

#### 6. MCA-Specific AI Features NEEDED

**New Agents**: Merchants, MCAs, Collections, Risk, Portfolio

**New Tools**: `get-merchants`, `get-mcas`, `get-portfolio-summary`, `get-collection-queue`, `get-risk-alerts`, `generate-collection-letter`, `detect-stacking`, `get-payment-schedule`

**New Artifacts**: `portfolio-summary`, `merchant-risk`, `collection-queue`, `payment-timeline`, `nsf-analysis`

### Summary

| Category | Keep | Transform | Remove |
|----------|------|-----------|--------|
| AI Agents (9) | 6 | 2 | 1 |
| AI Tools (29) | 17 | 7 | 5 |
| MCP Tools (48) | 31 | 13 | 10 |

### Key Files

| File | Changes Needed |
|------|---------------|
| [apps/api/src/mcp/server.ts](apps/api/src/mcp/server.ts) | Rename server "midday" → "abacus" |
| [apps/api/src/ai/agents/](apps/api/src/ai/agents/) | Remove TimeTracking, transform Invoices/Customers |
| [apps/api/src/ai/tools/tracker/](apps/api/src/ai/tools/tracker/) | DELETE entire directory |
| [apps/api/src/mcp/tools/tracker.ts](apps/api/src/mcp/tools/tracker.ts) | DELETE |
| [apps/api/src/mcp/tools/invoices.ts](apps/api/src/mcp/tools/invoices.ts) | Transform → mcas.ts |
| [apps/api/src/mcp/tools/customers.ts](apps/api/src/mcp/tools/customers.ts) | Transform → merchants.ts |

---

## SESSION 17: Mobile & Responsive Design
**Analyzed by**: Mobile & Responsive Design Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] Mobile-specific components in packages/ui
- [x] Responsive breakpoints in Tailwind config
- [x] Touch interactions and mobile navigation
- [x] Mobile header/sidebar behavior
- [x] PWA configuration (manifest.json, service worker)
- [x] Mobile-specific Midday branding

### Findings

#### 1. Mobile UI Components (`packages/ui/src/components/`)

##### Navigation Components
| Component | File | Mobile Behavior |
|-----------|------|-----------------|
| **Drawer** | `drawer.tsx` | Bottom sheet using `vaul` library, drag handle, `shouldScaleBackground` |
| **Sheet** | `sheet.tsx` | Side panel, 75% width (`w-3/4`) on mobile, `sm:max-w-sm` on desktop |
| **Dialog** | `dialog.tsx` | `w-[90vw] max-h-[calc(100svh-10vw)]` using safe viewport height |
| **Toast** | `toast.tsx` | Top position on mobile, bottom-left on desktop (`sm:bottom-0`) |

##### Touch Interaction Patterns
- **Slider**: `touch-none select-none` prevents default mobile touch behaviors
- **ScrollArea**: Custom scrollbar with `touch-none` for proper dragging
- **PromptInput**: Handles both `mousedown` and `touchend` events
- **MultipleSelector**: `onTouchEnd` for mobile dropdown handling

##### Responsive Utility Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useMediaQuery` | `use-media-query.ts` | Reactive viewport detection (e.g., `useMediaQuery("(min-width: 768px)")`) |
| `useResizeObserver` | `use-resize-observer.ts` | Element size change detection for dynamic layouts |

#### 2. Responsive Breakpoints (Tailwind Config)

**Configuration Files:**
- `packages/ui/tailwind.config.ts` - Base config
- `apps/dashboard/tailwind.config.ts` - Extends base, adds `mobile-slide` animation
- `apps/website/tailwind.config.ts` - Extends base, container centering

**Breakpoint Strategy:**
| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| (default) | 0px | Mobile-first base styles |
| `sm` | 640px | Tablets |
| `md` | 768px | **Primary mobile/desktop divide** |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large desktop |
| `3xl` | 1800px | **Custom addition** (beyond Tailwind default) |

**Common Responsive Patterns:**
```css
/* Layout stacking */
flex-col-reverse sm:flex-row    /* Stack on mobile, horizontal on desktop */

/* Text alignment */
text-center sm:text-left        /* Centered on mobile, left-aligned on desktop */

/* Width constraints */
w-3/4 sm:max-w-sm              /* 75% width mobile, max 384px tablet+ */

/* Visibility */
hidden md:flex                  /* Hidden on mobile, flex on desktop */
flex md:hidden                  /* Visible on mobile, hidden on desktop */

/* Spacing */
mt-2 sm:mt-0                   /* Adds margin on mobile, removes on desktop */
px-4 md:px-8                   /* Less padding mobile, more on desktop */
```

#### 3. Mobile Navigation & Sidebar

##### Desktop Sidebar (`apps/dashboard/src/components/sidebar.tsx`)
- Hidden on mobile: `hidden md:flex`
- Fixed 70px width (collapsed), 240px width (expanded on hover)
- Hover-based expansion with `cubic-bezier` CSS transition
- Contains team dropdown and main navigation menu
- Uses `z-50` stacking context

##### Mobile Menu (`apps/dashboard/src/components/mobile-menu.tsx`)
- Hamburger button visible only on mobile (`md:hidden`)
- Uses Radix Sheet component for slide-out drawer
- Slides in from left side (`side="left"`)
- Full MainMenu rendered inside with `isExpanded={true}`
- Auto-closes on menu item selection

##### Header (`apps/dashboard/src/components/header.tsx`)
- Fixed 70px height across all viewports
- Contains MobileMenu (small screens only)
- Desktop controls (reload, trial, notifications, user menu) on right
- Backdrop blur for modern visual effect
- Smooth header hiding animation with CSS custom properties

##### Main Layout (`apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx`)
```
Desktop:
┌─────────┬────────────────────────────────┐
│ Sidebar │  Content (ml-[70px])           │
│  70px   │  Padding: px-8                 │
└─────────┴────────────────────────────────┘

Mobile:
┌────────────────────────────────────────────┐
│  Content (full width)                      │
│  Padding: px-4                             │
└────────────────────────────────────────────┘
```

#### 4. PWA Configuration Status

**STATUS: ❌ NOT IMPLEMENTED**

| Feature | Status | Notes |
|---------|--------|-------|
| `manifest.json` | ❌ Missing | No web app manifest file |
| Service Worker | ❌ Missing | No `sw.js` or service worker registration |
| `next-pwa` | ❌ Missing | Not in dependencies |
| Offline Support | ❌ Missing | No offline fallback pages |
| Install Prompt | ❌ Missing | No PWA install handling |

**Missing for Full PWA Support:**
1. Web App Manifest (`manifest.json` with app name, icons, theme colors)
2. Service Worker for offline caching
3. `next-pwa` or `workbox` package configuration
4. Install prompt handling for "Add to Home Screen"
5. Offline fallback page

#### 5. Viewport Configuration

**Dashboard** (`apps/dashboard/src/app/[locale]/layout.tsx`):
```typescript
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,  // ⚠️ Prevents zoom - accessibility concern
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};
```

**Website** (`apps/website/src/app/layout.tsx`):
- Minimal viewport config (inherits Next.js defaults)
- Only theme color switching based on system preference

**Height-based Media Query** (`apps/dashboard/src/styles/globals.css`):
```css
@media (max-height: 860px) {
  /* Adjusts chat input positioning on short viewports */
}
```

#### 6. Mobile-Specific Branding

**Logo Usage:**
| Location | Component | Status |
|----------|-----------|--------|
| Desktop sidebar header | `Icons.LogoSmall` | ✅ Abacus SVG |
| Mobile menu sheet header | `Icons.LogoSmall` | ✅ Abacus SVG |
| Login/setup pages | `Icons.LogoSmall` | ✅ Abacus SVG |

**Midday References:**
- **No "Midday" text** in mobile-specific UI components
- All branding via `@midday/*` package namespace imports
- Will be updated with global namespace migration (`@midday/*` → `@abacus/*`)

**@midday/* Imports in Mobile Components:**
- `@midday/ui/sheet` - Sheet component import
- `@midday/ui/icons` - Logo icons import
- No hardcoded Midday strings in mobile navigation code

### Summary

| Category | Status | Notes |
|----------|--------|-------|
| Mobile-first CSS | ✅ Implemented | Tailwind responsive utilities throughout |
| Touch Interactions | ✅ Solid | Proper touch event handling, drag support |
| Mobile Navigation | ✅ Well-designed | Sheet-based hamburger menu, auto-close |
| Responsive Breakpoints | ✅ Consistent | `md:` (768px) as primary divide |
| PWA Support | ❌ Not implemented | No manifest, service worker, or offline |
| Accessibility | ⚠️ Concern | `userScalable: false` prevents zoom |
| Midday Branding | ✅ Clean | No text branding, only namespace imports |

### Action Items

#### Phase 1: Namespace Migration (with global migration)
1. [ ] `@midday/ui` imports → `@abacus/ui` in mobile components

#### Phase 2: PWA Implementation (Future)
1. [ ] Add `next-pwa` package to dashboard
2. [ ] Create `manifest.json` with Abacus branding, icons, theme colors
3. [ ] Implement service worker for offline caching
4. [ ] Add "Add to Home Screen" install prompt
5. [ ] Create offline fallback page

#### Phase 3: Accessibility (P1)
1. [ ] Consider removing `userScalable: false` for accessibility compliance
2. [ ] Or add toggle for users who need zoom functionality

#### Phase 4: Mobile Optimization (Future)
1. [ ] Add pull-to-refresh on portfolio lists
2. [ ] Consider touch gesture support for card swiping
3. [ ] Optimize for one-handed mobile use

### Key Files

| File | Mobile Purpose |
|------|----------------|
| [packages/ui/src/components/drawer.tsx](packages/ui/src/components/drawer.tsx) | Bottom sheet navigation |
| [packages/ui/src/components/sheet.tsx](packages/ui/src/components/sheet.tsx) | Side panel with responsive width |
| [packages/ui/src/hooks/use-media-query.ts](packages/ui/src/hooks/use-media-query.ts) | Viewport detection hook |
| [apps/dashboard/src/components/sidebar.tsx](apps/dashboard/src/components/sidebar.tsx) | Desktop-only sidebar |
| [apps/dashboard/src/components/mobile-menu.tsx](apps/dashboard/src/components/mobile-menu.tsx) | Mobile hamburger menu |
| [apps/dashboard/src/components/header.tsx](apps/dashboard/src/components/header.tsx) | Responsive header |
| [packages/ui/tailwind.config.ts](packages/ui/tailwind.config.ts) | Custom 3xl breakpoint |
| [apps/dashboard/src/app/[locale]/layout.tsx](apps/dashboard/src/app/[locale]/layout.tsx) | Viewport config |

---

## SESSION 18: Performance & Scalability
**Analyzed by**: Performance & Scalability Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] packages/cache/ - caching strategies
- [x] Database indexes in supabase/migrations/
- [x] CDN configuration and usage
- [x] Edge functions in apps/engine/
- [x] Rate limiting configuration
- [x] Performance monitoring (Sentry, etc.)

### Findings

#### 1. Caching Infrastructure

**Backend**: Redis 5.10.0 (`packages/cache/`)

**Redis Client Configuration** (`packages/cache/src/shared-redis.ts`):
| Setting | Value | Purpose |
|---------|-------|---------|
| Ping Interval | 60 seconds | Detect stale connections |
| Socket Family | IPv6 (prod) / IPv4 (dev) | Fly.io 6PN internal network |
| Connect Timeout | 10s (prod) / 5s (dev) | Connection establishment |
| TCP Keepalive | Enabled | Connection health |
| Nagle's Algorithm | Disabled | Lower latency |
| Reconnect Strategy | Exponential backoff (100ms to 3s max) | Resilience |

**Cache Types & TTLs** (`packages/cache/src/`):
| Cache | Prefix | Default TTL | Purpose |
|-------|--------|-------------|---------|
| User Cache | `user` | 30 min | User profile data |
| API Key Cache | `api-key` | 30 min | API key validation |
| Team Cache | `team` | 30 min | Team access permissions |
| Team Permissions | `team-permissions` | 30 min | Team-level permissions |
| Chat User Context | `chat:user` | 30 min | AI chat user context |
| Chat Team Context | `chat:team` | 5 min | AI chat team context |
| Chat Feedback | `chat:feedback` | No expiration | Permanent feedback storage |
| Suggested Actions | `suggested-actions` | 7 days | Action usage stats |
| Replication Cache | `replication` | 10 sec | Post-mutation replication lag |
| Widget Preferences | `widget-preferences` | 30 min | Dashboard widget config |

**Cache Pattern**: Read-through cache with JSON serialization, fallback to raw string values.

**Cache Invalidation**: Explicit invalidation via `invalidateUserContext()`, `invalidateTeamContext()` methods.

**Development Mode**: Chat cache disabled in development for simpler testing.

#### 2. Rate Limiting Configuration

**Library**: `hono-rate-limiter` v0.4.2

**Protected API Routes** (`apps/api/src/rest/middleware/index.ts`):
| Setting | Value |
|---------|-------|
| Window | 10 minutes |
| Limit | 100 requests per user |
| Key Strategy | User ID (fallback: "unknown") |
| Response | HTTP 429 |

**OAuth Routes** (`apps/api/src/rest/routers/oauth.ts`):
| Setting | Value |
|---------|-------|
| Window | 15 minutes |
| Limit | 20 requests per IP |
| Key Strategy | `x-forwarded-for` > `x-real-ip` > "unknown" |
| Response | HTTP 429 |

**Endpoint Coverage**:
| Middleware | Rate Limited | Notes |
|------------|--------------|-------|
| Protected | Yes | Per-user limiting |
| OAuth | Yes | Per-IP limiting (stricter) |
| Public | No | Unauthenticated endpoints |
| File | No | File downloads |

#### 3. Database Indexes - CRITICAL GAPS

**Total Indexes**: 93 across schema (75 in main migrations + 18 in packages)

##### CRITICAL MISSING INDEXES

**A. Multi-Tenant team_id Indexes** (Every query filters by team_id):
```sql
CREATE INDEX idx_transactions_team_id ON transactions(team_id);
CREATE INDEX idx_invoices_team_id ON invoices(team_id);
CREATE INDEX idx_customers_team_id ON customers(team_id);
CREATE INDEX idx_inbox_team_id ON inbox(team_id);
CREATE INDEX idx_bank_accounts_team_id ON bank_accounts(team_id);
CREATE INDEX idx_documents_team_id ON documents(team_id);
CREATE INDEX idx_bank_connections_team_id ON bank_connections(team_id);
```

**B. Full-Text Search GIN Indexes** (FTS columns exist but unindexed):
```sql
CREATE INDEX idx_invoices_fts ON invoices USING gin(fts);
CREATE INDEX idx_transactions_fts ON transactions USING gin(fts_vector);
CREATE INDEX idx_tracker_projects_fts ON tracker_projects USING gin(fts);
```

**C. RLS Policy Optimization Indexes**:
```sql
CREATE INDEX idx_users_on_team_team_role ON users_on_team(team_id, role);
CREATE INDEX idx_users_on_team_user_role ON users_on_team(user_id, role);
```

##### HIGH PRIORITY MISSING INDEXES

**Composite Indexes**:
```sql
CREATE INDEX idx_invoices_team_status ON invoices(team_id, status);
CREATE INDEX idx_customers_team_status ON customers(team_id, status);
CREATE INDEX idx_transactions_team_date ON transactions(team_id, date DESC);
CREATE INDEX idx_inbox_team_status ON inbox(team_id, status);
```

#### 4. Edge Functions Architecture

**Runtime**: Cloudflare Workers + Hono.js 4.11.4 (`apps/engine/`)

**Configuration** (`apps/engine/wrangler.toml`):
| Setting | Value |
|---------|-------|
| Compatibility Date | 2024-11-11 |
| Node Compatibility | nodejs_compat_v2 |
| Logpush | Enabled |
| Observability | Enabled |

**Routes**: `/transactions`, `/accounts`, `/institutions`, `/auth`, `/connections`, `/health`, `/rates`

**Bindings**: KV (token cache), R2 (document storage), mTLS (Teller), Workers AI (Llama 3.3)

**Cold Starts**: Minimal by design - no explicit mitigation needed.

**External Services**: Plaid, GoCardless, Teller, EnableBanking, Typesense, OpenAI

#### 5. Performance Monitoring

**Sentry Integration**:
| Config | Dashboard | API/Worker |
|--------|-----------|------------|
| Traces Sample Rate | 10% | 50% |
| Session Replays | 10% all, 100% errors | N/A |
| Source Maps | Uploaded | Uploaded |

**Configuration Files**:
- `apps/dashboard/sentry.server.config.ts` - Server-side
- `apps/dashboard/sentry.edge.config.ts` - Edge runtime
- `apps/api/src/instrument.ts` - API server (Bun)
- `apps/worker/src/instrument.ts` - Background jobs

**Cloudflare**: Logpush + Observability enabled

#### 6. CDN Configuration

**Cache Headers** (`apps/dashboard/vercel.json`):
| Route | Strategy | TTL |
|-------|----------|-----|
| Public share links | ISR | 1 hour |
| File preview | Cache-Control | 1 year (immutable) |
| Static assets | Cache-Control | 1 year |

**Deployment Regions**: Frankfurt, Northern Virginia, San Francisco

**API Timeouts**: 1024 MB memory, 30 seconds max duration

#### 7. Replication Lag Handling

**Implementation**: 10-second `ForcePrimary` cookie after auth, `x-force-primary` header passed to API. Prevents read-replica lag issues for new users.

### Summary

| Component | Status | Recommendation |
|-----------|--------|----------------|
| Redis Caching | Well-configured | No changes needed |
| Rate Limiting | Good coverage | Consider stricter OAuth limits |
| Database Indexes | CRITICAL GAPS | Add team_id + FTS indexes immediately |
| Edge Functions | Optimized | Minimal cold starts |
| Performance Monitoring | Comprehensive | Consider 100% traces for debugging |
| CDN | Properly configured | Add more regions if needed |
| Replication Handling | Implemented | Working as expected |

### Action Items

#### TIER 1: Critical (Deploy Immediately)
| Priority | Item | Impact |
|----------|------|--------|
| P0 | Add FTS GIN indexes | Fixes full table scans on search |
| P0 | Add team_id indexes (6 tables) | Fixes multi-tenant query performance |
| P0 | Add RLS optimization indexes | Fixes policy subquery overhead |

#### TIER 2: High Priority (Next Sprint)
| Priority | Item | Impact |
|----------|------|--------|
| P1 | Add composite indexes for common filters | Optimizes filtered queries |
| P1 | Add partial indexes for active records | Reduces index size |

#### TIER 3: Medium Priority (Q2)
| Priority | Item | Impact |
|----------|------|--------|
| P2 | Create materialized views for reporting | Pre-computed aggregates |
| P2 | Consider Redis cluster for scaling | Higher availability |

### Key Files

| File | Purpose |
|------|---------|
| [packages/cache/src/shared-redis.ts](packages/cache/src/shared-redis.ts) | Redis client config |
| [apps/api/src/rest/middleware/index.ts](apps/api/src/rest/middleware/index.ts) | Rate limiting |
| [supabase/migrations/](supabase/migrations/) | Add indexes here |
| [apps/engine/wrangler.toml](apps/engine/wrangler.toml) | Workers config |
| [apps/dashboard/sentry.server.config.ts](apps/dashboard/sentry.server.config.ts) | Sentry config |

---

## SESSION 19: Legal, Compliance & Security Audit
**Analyzed by**: Legal, Compliance & Security Expert Session
**Date**: 2025-01-25

### Areas Analyzed
- [x] Terms of service, privacy policy references
- [x] Data retention policies and deletion implementations
- [x] SECURITY.md and security disclosures
- [x] PII handling and encryption (AES-256-GCM)
- [x] Audit logging and activity tracking
- [x] Row Level Security (RLS) policies
- [x] Authentication and authorization mechanisms
- [x] Compliance-relevant configuration

### Findings

#### 1. Legal Documents Status (CRITICAL - Still Midday-Branded)

| Document | Location | Last Updated | Branding Status |
|----------|----------|--------------|-----------------|
| Terms of Service | `apps/website/src/app/terms/page.tsx` | Oct 26, 2023 | ❌ **Midday Labs AB** |
| Privacy Policy | `apps/website/src/app/policy/page.tsx` | Oct 26, 2023 | ❌ **Midday Labs AB** |
| SECURITY.md | `SECURITY.md` | Current | ❌ **security@midday.ai** |
| LICENSE | `LICENSE` | Current | ⚠️ AGPL-3.0 (Midday Labs AB copyright) |

**Terms of Service Issues**:
- Company: "Midday Labs AB" throughout
- DMCA contact: `dmca@midday.ai`
- Support contact: `support@midday.ai`
- Governing law: Sweden jurisdiction
- References: Fortnox, Xero, QuickBooks (freelancer integrations)
- **Missing**: MCA-specific financial disclaimers

**Privacy Policy Issues**:
- Operator: "Midday Labs AB"
- Contact: `support@midday.ai`
- Data transfer: "Sweden"
- Third-party services: Firebase, Apple/Google In-App Payments
- **Strengths**: GDPR compliance, user rights documented, Gmail API limited use statement

#### 2. Security Infrastructure (✅ Strong Foundation)

**Encryption Implementation** (`packages/encryption/src/index.ts`):
- Algorithm: **AES-256-GCM** (industry standard)
- IV: 16 bytes (128 bits)
- Auth tag: 16 bytes (128 bits)
- Key: `MIDDAY_ENCRYPTION_KEY` - 64-char hex (32 bytes)

**What's Encrypted**:
| Data Type | Status | Location |
|-----------|--------|----------|
| API Keys | ✅ Encrypted + Hashed | `packages/db/src/queries/api-keys.ts` |
| Bank Account Numbers | ✅ Encrypted | `packages/db/src/queries/bank-connections.ts` |
| IBAN | ✅ Encrypted | `bank_accounts` table |
| OAuth State | ✅ Encrypted | `packages/encryption/src/index.ts` |

**Security Disclosure** (`SECURITY.md`):
- Contact: `security@midday.ai` (needs update)
- 3 business day response SLA
- Out-of-scope: Clickjacking, CSRF on logout, MITM, DoS, missing CSP

**Security Headers** (`apps/api/src/index.ts`):
- ✅ `secureHeaders()` middleware (Hono)
- ✅ X-Frame-Options: DENY
- ✅ CORS whitelist via `ALLOWED_API_ORIGINS`

#### 3. Authentication & Authorization (✅ Multi-Layer)

**Three Auth Methods**:
1. **Supabase JWT** - JWKS verification via Jose library
2. **OAuth Access Tokens** - Format: `mid_access_token_*`
3. **API Keys** - Format: `mid_` + 64 hex chars (SHA-256 hashed)

**Security Features**:
- ✅ Timing-safe comparison for secrets (`apps/api/src/utils/oauth.ts`)
- ✅ File access JWT validation (`apps/api/src/rest/middleware/file-auth.ts`)
- ✅ Scope-based authorization (30 defined scopes)

**Defined Scopes** (`apps/api/src/utils/scopes.ts`):
```
bank-accounts.read/write, customers.read/write, documents.read/write,
inbox.read/write, invoices.read/write, transactions.read/write,
users.read/write, teams.read/write, apis.all, apis.read
```

#### 4. Row Level Security (RLS) - Multi-Tenant Isolation

**39+ Tables with RLS Enabled**:
- `api_keys`, `bank_accounts`, `bank_connections`
- `customers`, `documents`, `inbox`, `invoices`
- `oauth_access_tokens`, `oauth_applications`
- `teams`, `transactions`, `users_on_team`
- And 27 more...

**Policy Pattern** (`supabase/migrations/20260119060000_add_users_on_team_and_auth_trigger.sql`):
- Team-based isolation via `team_id` + `auth.uid()` context
- Users can view their own team memberships
- Team owners can manage all memberships
- Authenticated users can create teams

#### 5. PII Handling & Data Masking (✅ Well Implemented)

**Frontend Masking** (`apps/dashboard/src/components/bank-account.tsx`):
- Shows only last 4 characters by default
- Requires explicit user action to reveal
- Lazy-loads sensitive data only when requested

**Backend Decryption**:
- Sensitive fields decrypted only on explicit request
- IBAN, account numbers encrypted at rest
- 5-minute client-side cache for revealed data

#### 6. Audit Logging System

**Activity Tracking** (`packages/db/src/utils/log-activity.ts`):
- ✅ Logs user and system events
- ✅ JSONB metadata for flexible storage
- ✅ Priority levels and grouping support
- ⚠️ Non-blocking (errors caught, logged to console)

**40+ Event Types Tracked** (`packages/events/src/events.ts`):
| Category | Events |
|----------|--------|
| Auth | SignIn, SignOut, Registered, MfaVerify |
| Banking | ConnectBank*, DeleteBank, ReconnectConnection |
| Transactions | TransactionsCreated, Enriched, Exported |
| Invoices | InvoicePaid, Overdue, Sent, Cancelled |
| Documents | DocumentUploaded, Processed |

**API Key Usage Tracking**:
- `last_used_at` timestamp updated on each use
- Enables audit trail for API access

#### 7. Data Retention & Deletion

**User Deletion** (`packages/db/src/queries/users.ts`):
- Cascade deletion of user's sole-member teams
- Coordinated deletion across: Database, Supabase Auth, Resend contacts
- ⚠️ No audit log of what was deleted

**Team Deletion** (`packages/jobs/src/tasks/team/delete.ts`):
- Trigger.dev async job
- Deletes external provider connections
- Unregisters bank sync scheduler

**GDPR User Rights** (documented in Privacy Policy):
- ✅ Right to access, rectification, deletion
- ✅ Right to data portability
- ✅ Right to withdraw consent
- ❌ No automated data export endpoint visible

#### 8. Compliance Gaps & Risks

##### 🔴 CRITICAL (P0)
| Issue | Impact | Location |
|-------|--------|----------|
| Terms & Privacy use "Midday Labs AB" | Legal liability | `apps/website/src/app/terms/`, `policy/` |
| Security contact `@midday.ai` | Disclosure failures | `SECURITY.md`, `security.txt` |
| Support emails `@midday.ai` | User communication fails | 5 locations in legal pages |
| No MCA financial disclaimers | Regulatory risk | Terms of Service |

##### 🟡 HIGH (P1)
| Issue | Impact | Location |
|-------|--------|----------|
| No immutable audit trail | Compliance audits difficult | `activities` table can be archived |
| No data retention TTL | Storage costs, GDPR risk | No cleanup jobs exist |
| AGPL-3.0 license | Network copyleft requirements | `LICENSE` |
| Sweden jurisdiction | May not suit US MCA operations | Terms of Service |

##### 🟠 MEDIUM (P2)
| Issue | Impact | Location |
|-------|--------|----------|
| No CCPA-specific policy | California compliance | Privacy Policy |
| No SOC 2 certification | Enterprise customer requirement | Footer badge says "in progress" |
| Activity metadata unencrypted | Sensitive data in logs | `activities.metadata` JSONB |
| No deletion audit trail | Cannot prove GDPR compliance | User/team deletion |

#### 9. MCA-Specific Compliance Needs

**Financial Services Requirements** (NOT currently implemented):
- [ ] Usury/interest rate disclosures
- [ ] Factor rate clear disclosure requirements
- [ ] RTR (Right to Receivables) legal language
- [ ] State-by-state MCA licensing compliance
- [ ] Broker/ISO disclosure requirements

**Recommended Additions to Terms**:
1. MCA is purchase of future receivables, not a loan
2. Factor rate disclosure methodology
3. Collection practices disclosure
4. ACH authorization terms
5. Merchant data sharing with ISOs

### Summary

| Category | Status | Priority |
|----------|--------|----------|
| Encryption (AES-256-GCM) | ✅ Strong | - |
| Authentication | ✅ Multi-layer | - |
| Row Level Security | ✅ 39+ tables | - |
| Data Masking | ✅ Implemented | - |
| Activity Logging | ⚠️ Exists but not immutable | P2 |
| Legal Documents | ❌ Midday branding | **P0** |
| Security Contact | ❌ Midday email | **P0** |
| MCA Disclaimers | ❌ Missing | **P0** |
| Data Retention | ❌ No TTL/cleanup | P1 |
| GDPR Export | ❌ No endpoint | P1 |

### Action Items

#### Phase 1: Critical Legal Updates (P0)
1. [ ] Rewrite Terms of Service for Abacus/MCA:
   - Change company from "Midday Labs AB" to Abacus entity
   - Update contact emails to `@abacuslabs.co`
   - Add MCA-specific financial disclaimers
   - Review jurisdiction (Sweden → appropriate for MCA)
   - Add ACH authorization terms
   - Add factor rate disclosure methodology
2. [ ] Rewrite Privacy Policy for Abacus:
   - Update operator name and contacts
   - Add MCA-specific data processing disclosures
   - Consider adding CCPA-specific section
3. [ ] Update `SECURITY.md`:
   - Change contact to `security@abacuslabs.co`
4. [ ] Update `security.txt`:
   - Update contact information

#### Phase 2: Compliance Infrastructure (P1)
1. [ ] Implement immutable audit log:
   - Separate `audit_log` table with append-only policy
   - Digital signatures for integrity
2. [ ] Add data retention TTL:
   - Define retention periods by data type
   - Implement cleanup jobs via Trigger.dev
3. [ ] Create GDPR data export endpoint:
   - `/api/user/export` returning all user data
   - Machine-readable format (JSON)
4. [ ] Add deletion audit trail:
   - Log what was deleted, when, by whom
   - Retain deletion records for compliance period

#### Phase 3: MCA Compliance (P2)
1. [ ] Create MCA disclosure page:
   - Factor rate explanation
   - RTR legal language
   - Collection practices
2. [ ] Add state licensing notices:
   - Required disclosures by state
3. [ ] Implement consent tracking:
   - Merchant ACH authorization records
   - ISO data sharing consent

#### Phase 4: Security Enhancements (P3)
1. [ ] Consider CSP headers (currently out-of-scope)
2. [ ] Add webhook delivery logging
3. [ ] Encrypt sensitive activity metadata
4. [ ] Implement rate limiting audit logs

### Key Files

| File | Changes Needed |
|------|---------------|
| [apps/website/src/app/terms/page.tsx](apps/website/src/app/terms/page.tsx) | Full rewrite for Abacus MCA |
| [apps/website/src/app/policy/page.tsx](apps/website/src/app/policy/page.tsx) | Update operator, contacts, MCA disclosures |
| [SECURITY.md](SECURITY.md) | Update contact email |
| [apps/website/public/.well-known/security.txt](apps/website/public/.well-known/security.txt) | Update contact info |
| [packages/db/src/utils/log-activity.ts](packages/db/src/utils/log-activity.ts) | Consider immutable audit option |
| [supabase/migrations/](supabase/migrations/) | Add audit_log table, retention policies |
| [apps/website/src/components/footer.tsx](apps/website/src/components/footer.tsx) | SOC2 badge status update |

---

## NOTES & DISCOVERIES

*Add unexpected findings, blockers, or important notes here:*

- **Session 12**: The `transactions.tsx` email template is well-suited for weekly portfolio summaries - just needs MCA terminology updates
- **Session 12**: Notification batching pattern exists but only used for inbox - excellent opportunity for daily/weekly MCA digests
- **Session 12**: 3 sender addresses still use `middaybot@midday.ai` domain which will fail email delivery
- **Session 15**: Swedish translations are 100% complete and ready to enable - just requires uncommenting 3 lines
- **Session 15**: 115 files contain "Midday" hardcoded strings - dashboard (20), email (30), website (45), API/backend (20)
- **Session 15**: Email system has separate translation mechanism from dashboard - both need updates
- **Session 15**: No MCA-specific formatting utilities exist yet - need factor rate, payment frequency, collection status formatters
- **Session 15**: `@languine/react-email` migration is flagged as TODO in email translations file
- **Session 16**: The AI infrastructure is highly sophisticated with agent routing, 29 tools, 15 visual artifacts, and a full MCP server with 48 tools
- **Session 16**: Reports and Analytics agents are HIGHLY relevant for MCA portfolio analysis - no transformation needed
- **Session 16**: `get-business-health-score` and `get-cash-flow-stress-test` tools are perfect foundations for portfolio health scoring
- **Session 16**: Time tracking features (agent, 5 tools, 10 MCP tools) should be completely removed - not relevant for MCA
- **Session 16**: MCP server is named "midday" and exposes resources with `midday://` URIs - needs renaming to "abacus"
- **Session 14**: Documentation site (apps/docs/) uses Mintlify framework with 25 Midday references across 8 files - mint.json is critical (9 refs)
- **Session 14**: Dashboard in-app help content is clean (no Midday refs) but lacks MCA-specific tooltips and educational content
- **Session 14**: Most package READMEs are minimal (1-3 lines) - opportunity to add MCA-focused documentation
- **Session 14**: mcp.mdx is already properly updated for Abacus - can serve as template for other docs
- **Session 14**: Root docs (README.md, PRODUCT_VISION.md, CLAUDE.md) already MCA-focused - good foundation
- **Session 13**: Polar webhook handler is STILL MOUNTED and active at `/webhooks/polar` - security risk, should be removed immediately
- **Session 13**: Plan limits are displayed but never enforced at API level - users can exceed limits without being blocked
- **Session 13**: pricing-section-v2.tsx contains old $29/$79/$129 pricing - should be deleted to avoid confusion
- **Session 13**: Pricing already updated to $399/$499 MCA-appropriate levels (not $29/$49 freelancer pricing)
- **Session 13**: Plan limit metrics are freelancer-focused (invoices, inbox) - should be changed to MCA metrics (merchants, advances)
- **Session 17**: PWA is NOT implemented - no manifest.json, service worker, or offline support configured
- **Session 17**: `userScalable: false` in viewport config may cause accessibility issues for users who need zoom
- **Session 17**: Mobile navigation uses Sheet component from `vaul` library - well-optimized for touch interactions
- **Session 17**: Custom `3xl: 1800px` breakpoint added beyond Tailwind defaults for extra-large displays
- **Session 17**: `md:` breakpoint (768px) is the primary mobile/desktop divide throughout the codebase
- **Session 17**: No "Midday" text branding in mobile-specific UI - only `@midday/*` package namespace imports
- **Session 18**: CRITICAL - 6 tables missing team_id indexes causing full table scans on multi-tenant queries
- **Session 18**: CRITICAL - FTS columns have generated tsvector but NO GIN indexes - search causes full table scans
- **Session 18**: RLS policy subqueries lack composite indexes on (team_id, role) - repeated overhead per row
- **Session 18**: Redis caching well-architected with proper TTLs, invalidation, and health checks
- **Session 18**: Rate limiting covers protected routes (100/10min) and OAuth (20/15min) but public endpoints unprotected
- **Session 18**: Cloudflare Workers have minimal cold starts - no optimization needed
- **Session 18**: Sentry sampling at 10-50% may miss important traces during debugging
- **Session 18**: Replication lag handling via ForcePrimary cookie correctly implemented
- **Session 19**: Security infrastructure is strong - AES-256-GCM encryption, multi-layer auth, timing-safe comparisons, RLS on 39+ tables
- **Session 19**: Legal documents CRITICAL - Terms of Service and Privacy Policy still reference "Midday Labs AB" and Swedish jurisdiction
- **Session 19**: 5 email addresses in legal pages use `@midday.ai` domain - will fail user communication
- **Session 19**: Activity logging exists but is NOT immutable - activities can be archived/deleted, not suitable for compliance audits
- **Session 19**: No data retention TTL or cleanup jobs - potential GDPR/storage issues
- **Session 19**: No GDPR data export endpoint visible - user data portability requirement not met
- **Session 19**: MCA-specific compliance completely missing - need factor rate disclosures, ACH authorization terms, RTR language
- **Session 19**: Footer shows "SOC2 In Progress" badge but no evidence of certification process in codebase
- **Session 19**: AGPL-3.0 license has network copyleft requirements - consider implications for MCA SaaS
- **Agent 20**: ✅ IMPLEMENTED Merchant Portal & Access Control - 6 new database tables (mca_deals, mca_payments, merchant_portal_sessions, merchant_portal_invites, merchant_portal_access, payoff_letter_requests), tRPC router, portal UI with branding, admin preview, email templates, Trigger.dev jobs. See FEATURE_PARITY.md for full details.

---

*Document maintained by multiple parallel Claude Code sessions*
