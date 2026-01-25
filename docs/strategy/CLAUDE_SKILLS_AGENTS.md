# Claude Code Skills & Agents for Abacus

This document specifies recommended Claude Code skills, agents, and MCP configurations for the Abacus development workflow.

---

## Table of Contents

1. [Skills Reference](#skills-reference)
2. [Agents Reference](#agents-reference)
3. [MCP Servers](#mcp-servers)
4. [Implementation Guide](#implementation-guide)

---

## Skills Reference

### Sprint Planning Skill (PRIMARY)

#### `sprint-planning`

**Purpose**: Generate a complete sprint plan from your 20-week roadmap.

**Trigger**: `/sprint <week>` or "What's the plan for Week 5?"

**Location**: `.claude/skills/sprint-planning.md`

**What it does**:
1. Reads that week's deliverables from `ROADMAP.md`
2. Breaks each deliverable into atomic tasks
3. Outputs a complete sprint doc using `SPRINT_TEMPLATE.md` format
4. Includes real file paths, validation criteria, exit criteria

**Example**:
```
You: /sprint 5
Claude: [Generates complete sprint document with 5 atomic tasks, file paths, validation criteria]
```

---

### Database & Backend Skills

#### `supabase:rls-policy`

**Purpose**: Generate Row Level Security policies that enforce multi-tenant isolation via `org_id`.

**Trigger**: `/rls-policy <table_name>`

**Template Output**:
```sql
-- RLS Policy for {table_name}
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Select policy: users can only see their org's data
CREATE POLICY "{table_name}_select_policy" ON {table_name}
    FOR SELECT
    USING (org_id = auth.jwt() ->> 'org_id');

-- Insert policy: users can only insert into their org
CREATE POLICY "{table_name}_insert_policy" ON {table_name}
    FOR INSERT
    WITH CHECK (org_id = auth.jwt() ->> 'org_id');

-- Update policy: users can only update their org's data
CREATE POLICY "{table_name}_update_policy" ON {table_name}
    FOR UPDATE
    USING (org_id = auth.jwt() ->> 'org_id')
    WITH CHECK (org_id = auth.jwt() ->> 'org_id');

-- Delete policy: users can only delete their org's data
CREATE POLICY "{table_name}_delete_policy" ON {table_name}
    FOR DELETE
    USING (org_id = auth.jwt() ->> 'org_id');
```

**Validation Rules**:
- Every table MUST have `org_id` column
- All policies MUST reference `auth.jwt() ->> 'org_id'`
- Service role bypasses (for background jobs) must be explicit

---

#### `supabase:migration`

**Purpose**: Generate type-safe migrations with rollback scripts.

**Trigger**: `/migration <description>`

**Template Output**:
```sql
-- Migration: {description}
-- Created: {timestamp}

-- UP
BEGIN;
  -- Changes here
COMMIT;

-- DOWN (for rollback)
BEGIN;
  -- Reverse changes here
COMMIT;
```

**Post-Generation Actions**:
1. Run `supabase db diff` to verify
2. Generate TypeScript types with `supabase gen types`
3. Update `packages/supabase/src/types.ts`

---

### MCA Domain Skills

#### `abacus:letter-template`

**Purpose**: Generate letter templates with proper variable substitution for MCA documents.

**Trigger**: `/letter <type>` where type is: `payoff | zero-balance | renewal | demand | verification`

**Template Variables**:
| Variable | Source | Example |
|----------|--------|---------|
| `{{merchant.name}}` | merchants.business_name | "Joe's Pizza" |
| `{{merchant.dba}}` | merchants.dba | "Joe's" |
| `{{deal.funded_amount}}` | deals.funded_amount | $50,000.00 |
| `{{deal.factor_rate}}` | deals.factor_rate | 1.35 |
| `{{deal.rtr}}` | deals.rtr_amount | $67,500.00 |
| `{{deal.balance}}` | calculated | $23,450.00 |
| `{{deal.payoff_date}}` | input | January 31, 2026 |
| `{{company.name}}` | org_settings.company_name | "Honest Funding" |
| `{{company.address}}` | org_settings.address | "123 Main St..." |
| `{{company.phone}}` | org_settings.phone | "(555) 123-4567" |
| `{{company.logo_url}}` | org_settings.logo_url | URL |

**Output Format**: React component using `@react-pdf/renderer` with branding support.

---

#### `abacus:risk-scoring`

**Purpose**: Implement risk scoring following the documented 0-100 formula.

**Trigger**: `/risk-score`

**Formula Implementation**:
```typescript
interface RiskFactors {
  nsfLast7Days: number;      // 0-30 points (10 pts per NSF, max 30)
  daysPastDue: number;       // 0-30 points (5 pts per day, max 30)
  totalNsfCount: number;     // 0-20 points (2 pts per NSF, max 20)
  lateLast7Days: number;     // 0-20 points (5 pts per late, max 20)
}

function calculateRiskScore(factors: RiskFactors): number {
  const nsfScore = Math.min(factors.nsfLast7Days * 10, 30);
  const dpdScore = Math.min(factors.daysPastDue * 5, 30);
  const totalNsfScore = Math.min(factors.totalNsfCount * 2, 20);
  const lateScore = Math.min(factors.lateLast7Days * 5, 20);

  return nsfScore + dpdScore + totalNsfScore + lateScore;
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 20) return 'low';
  if (score < 40) return 'medium';
  if (score < 60) return 'high';
  return 'critical';
}
```

---

### Background Jobs Skills

#### `trigger:job`

**Purpose**: Scaffold Trigger.dev background jobs with proper patterns.

**Trigger**: `/trigger-job <job_name>`

**Template Output**:
```typescript
import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

export const {jobName}Task = task({
  id: "{job_name}",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: {JobPayload}) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for background jobs
    );

    // Job implementation

    return { success: true };
  },
});
```

**Job Types**:
- `scheduled` - Cron-based (weekly summaries)
- `event` - Triggered by webhooks (NSF detection)
- `realtime` - Supabase Realtime triggers

---

#### `trigger:scheduled`

**Purpose**: Create scheduled jobs for recurring tasks.

**Trigger**: `/trigger-scheduled <job_name> <cron>`

**Common Schedules**:
| Job | Cron | Description |
|-----|------|-------------|
| weekly-summary | `0 9 * * 1` | Monday 9am portfolio summary |
| daily-risk-scan | `0 6 * * *` | 6am risk score recalculation |
| sheets-sync | `*/15 * * * *` | Every 15 min sync check |

---

### UI & Component Skills

#### `abacus:component`

**Purpose**: Generate React components matching the Mercury/Ramp aesthetic.

**Trigger**: `/component <name> <type>`

**Design Rules Enforced**:
- Shadow borders (`shadow-sm`), not hard borders
- Generous padding (`p-6` for cards, `p-4` for sections)
- Color palette: Sky blue primary (#0ea5e9), orange secondary (#f97316)
- Typography: Inter for UI, JetBrains Mono for numbers
- Data tables use `@tanstack/react-table`
- Cards use `packages/ui/src/components/card.tsx`

**Component Types**:
- `card` - Data display card with optional chart
- `table` - Sortable, filterable data table
- `form` - Form with validation (react-hook-form + zod)
- `modal` - Dialog with standard actions
- `stat` - KPI display with trend indicator

---

### Data Sync Skills

#### `abacus:sheets-sync`

**Purpose**: Generate Google Sheets sync handlers.

**Trigger**: `/sheets-sync <direction>`

**Directions**:
- `pull` - Sheets → Supabase
- `push` - Supabase → Sheets
- `bidirectional` - Both with conflict resolution

**Conflict Resolution Strategy**:
1. Last-write-wins by default
2. Configurable per-column priority
3. Conflict log for manual review

---

## Agents Reference

### Code Quality Agents

#### `mca-reviewer`

**Type**: Code reviewer agent (post-implementation)

**Purpose**: Review code for MCA domain correctness.

**Trigger**: Run after completing deal/payment/merchant-related code.

**Checks**:
- [ ] Factor rate calculations use multiplication, not addition
- [ ] Balance calculations: `rtr_amount - total_paid`
- [ ] Money values use cents (integers), not floats
- [ ] Date handling uses UTC for storage, local for display
- [ ] Status transitions follow state machine (Active → Delinquent → Collections)

**How to Invoke**:
```
Use the Task tool with subagent_type="code-reviewer" and prompt:
"Review this code for MCA domain correctness. Check factor rate
calculations, money handling, and status transitions."
```

---

#### `rls-auditor`

**Type**: Security auditor agent

**Purpose**: Audit Supabase migrations for RLS coverage.

**Trigger**: On any file change in `supabase/migrations/`.

**Checks**:
- [ ] Every table has RLS enabled
- [ ] Every table has all 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Policies reference `org_id`
- [ ] No `USING (true)` policies (security hole)
- [ ] Service role usage is justified

---

### Design Consistency Agents

#### `midday-design-checker`

**Type**: Design consistency agent

**Purpose**: Ensure UI components match Midday's design language.

**Trigger**: Run when creating or modifying UI components.

**Design Standards to Enforce**:

| Aspect | Midday Standard | Example |
|--------|-----------------|---------|
| **Borders** | Shadow borders, not hard borders | `shadow-sm` not `border` |
| **Spacing** | Generous whitespace | `p-6` for cards, `gap-6` for grids |
| **Colors** | Muted, professional palette | Sky blue primary, not bright blue |
| **Typography** | Inter for UI, mono for numbers | `font-mono` for financial figures |
| **Cards** | Soft shadows, rounded corners | `rounded-lg shadow-sm` |
| **Tables** | Clean, minimal, hoverable rows | `hover:bg-muted/50` |
| **Buttons** | Subtle, not loud | Primary is muted, not saturated |
| **Icons** | Lucide icons, consistent sizing | `h-4 w-4` for inline |

**Reference Patterns**:
- Dashboard layouts: `apps/dashboard/src/components/`
- UI primitives: `packages/ui/src/components/`
- Color tokens: `packages/ui/src/globals.css`

**Checklist**:
- [ ] Uses existing UI components from `packages/ui/`
- [ ] Follows color palette (sky blue #0ea5e9, orange #f97316)
- [ ] Uses shadow borders, not hard borders
- [ ] Has generous whitespace (p-6 for cards)
- [ ] Numbers use monospace font
- [ ] Matches Mercury/Ramp/Linear aesthetic

**How to Invoke**:
```
Use the Task tool with subagent_type="code-reviewer" and prompt:
"Review this UI component for Midday design consistency. Check:
- Shadow borders instead of hard borders
- Generous whitespace (p-6 for cards)
- Correct color palette usage
- Monospace font for numbers
- Uses existing packages/ui components"
```

---

#### `midday-sync-agent`

**Type**: Upstream sync agent

**Purpose**: Monitor Midday's GitHub for new features and generate adaptation PRDs.

**Trigger**: Manual invocation: "Check Midday for new features"

**Workflow**:

```
1. FETCH UPSTREAM
   - git fetch upstream (Midday repo)
   - Get commits since last sync
   - Filter to relevant changes (exclude docs-only, CI-only)

2. ANALYZE CHANGES
   For each significant commit/PR:
   - Summarize what it does
   - Categorize: UI improvement | Bug fix | New feature | Refactor | Infra
   - Assess MCA relevance (High/Medium/Low/None)

3. GENERATE PRD
   For relevant changes, output:

   ## Feature: [Name from Midday]

   ### What Midday Added
   [Summary of the upstream change]

   ### Files Changed
   - path/to/file.tsx
   - path/to/other.ts

   ### MCA Relevance
   [Why this matters for Abacus]

   ### Adaptation Required
   - [ ] Rename components/variables to Abacus terminology
   - [ ] Adjust business logic for MCA (specify changes)
   - [ ] Update styling to match Abacus brand
   - [ ] Add MCA-specific fields/data

   ### Implementation Steps
   1. Cherry-pick commit: git cherry-pick <sha>
   2. Resolve conflicts in: [list files]
   3. Rename: [specific renames]
   4. Test: [what to verify]

   ### Effort Estimate
   Small / Medium / Large

   ### Priority
   P0 (critical) / P1 (important) / P2 (nice-to-have) / Skip

4. DECISION MATRIX
   Output summary table:

   | Feature | Relevance | Effort | Priority | Action |
   |---------|-----------|--------|----------|--------|
   | Feature A | High | Small | P0 | Merge |
   | Feature B | Low | Large | Skip | Skip |
```

**Example Output**:
```markdown
## Midday Sync Report - January 2026

### New Features Found: 3

#### 1. Enhanced Transaction Filtering
**Midday Commit**: abc123
**What It Does**: Adds advanced date range and category filters to transactions
**MCA Relevance**: HIGH - We need similar filtering for payment history
**Adaptation**:
- Rename "transactions" to "payments"
- Add MCA-specific filters (NSF, late, on-time)
- Keep date range picker as-is
**Priority**: P1 - Implement after Phase 1 launch

#### 2. Dark Mode Support
**MCA Relevance**: LOW - Nice to have but not priority
**Priority**: Skip for now

#### 3. Improved Mobile Responsive Tables
**MCA Relevance**: MEDIUM - Collections reps use mobile
**Adaptation**:
- Apply to merchant table
- Apply to collections queue
**Priority**: P2 - Backlog
```

**Configuration**:
```yaml
# Suggested config for midday-sync agent
upstream_repo: https://github.com/midday-ai/midday.git
sync_branch: main
categories_to_watch:
  - apps/dashboard/src/components
  - packages/ui
  - apps/dashboard/src/actions
ignore_patterns:
  - "*.md"
  - ".github/*"
  - "docs/*"
relevance_keywords:
  high: [dashboard, table, chart, filter, export, pdf]
  medium: [auth, settings, notification]
  low: [invoice, tracker, time]
```

**How to Invoke**:
```
Use the Task tool with subagent_type="Explore" and prompt:
"Fetch the latest from Midday's GitHub (https://github.com/midday-ai/midday).
Compare recent commits to our current state. For each relevant change:
1. Summarize what it does
2. Rate MCA relevance (High/Medium/Low)
3. If relevant, outline adaptation steps
4. Output a PRD for implementing it in Abacus"
```

---

### Testing Agents

#### `sync-tester`

**Type**: Test generation agent

**Purpose**: Generate test cases for sync logic.

**Trigger**: On changes to sheets sync code.

**Test Scenarios**:
- Initial sync (empty → populated)
- Incremental sync (changes only)
- Conflict detection (both sides changed)
- Error recovery (partial failure)
- Rate limiting (API quota handling)

---

## MCP Servers

### Currently Configured

| MCP Server | Purpose | Status |
|------------|---------|--------|
| **Supabase MCP** | Database operations, migrations, types | Active |
| **Stripe MCP** | Payment products, prices, customers | Active |
| **Plaid MCP** | Sandbox tokens, bank testing | Active |

### Recommended Additions

#### Google Sheets MCP

**Purpose**: Direct Sheets API access for testing and debugging.

**Key Operations**:
- `sheets.read` - Read spreadsheet data
- `sheets.write` - Write data to cells
- `sheets.getMetadata` - Get column headers, formulas

**Setup**: Requires Google Cloud OAuth credentials.

---

#### Resend MCP

**Purpose**: Test email templates without sending.

**Key Operations**:
- `resend.preview` - Preview email HTML
- `resend.send` - Send test email
- `resend.templates` - List/manage templates

---

#### Vercel MCP

**Purpose**: Deployment management.

**Key Operations**:
- `vercel.deploy` - Deploy to preview/production
- `vercel.logs` - View deployment logs
- `vercel.env` - Manage environment variables

**Projects**:
- `abacus-dashboard` (app.abacuslabs.co)
- `abacus-website` (abacuslabs.co)

---

## Implementation Guide

### Priority Order

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | `supabase:rls-policy` | Low | High (security) |
| **P0** | `mca-reviewer` agent | Medium | High (domain correctness) |
| **P0** | `midday-design-checker` | Medium | High (consistency) |
| **P1** | `abacus:letter-template` | Medium | High (P0 feature) |
| **P1** | `midday-sync-agent` | Medium | High (stay current) |
| **P1** | `trigger:job` | Low | Medium (background jobs) |
| **P2** | `abacus:risk-scoring` | Low | Medium (collections) |
| **P2** | `rls-auditor` agent | Medium | Medium (security) |
| **P3** | `abacus:component` | Medium | Low (consistency) |
| **P3** | Google Sheets MCP | Low | Low (debugging) |

---

### How to Create a Skill

Skills are defined as prompt files in `.claude/skills/`:

```markdown
# .claude/skills/supabase-rls-policy.md

## Trigger
/rls-policy <table_name>

## Description
Generate multi-tenant RLS policies for a Supabase table.

## Prompt
You are generating Row Level Security policies for the table {table_name}.

Follow these rules:
1. Always use org_id for tenant isolation
2. Reference auth.jwt() ->> 'org_id' in policies
3. Create all 4 policy types: SELECT, INSERT, UPDATE, DELETE
4. Name policies consistently: {table_name}_{operation}_policy

Generate the SQL migration file.
```

---

### CLAUDE.md Additions

Add these sections to your existing CLAUDE.md:

```markdown
## Custom Skills

| Skill | Command | Description |
|-------|---------|-------------|
| RLS Policy | /rls-policy <table> | Generate multi-tenant RLS |
| Letter Template | /letter <type> | Generate branded letter |
| Risk Scoring | /risk-score | Implement risk formula |
| Trigger Job | /trigger-job <name> | Scaffold background job |
| Component | /component <name> <type> | Generate UI component |

## MCA Domain Rules (Enforced by Agents)

- **Money**: Always store in cents (integer), display with formatter
- **Factor Rates**: Multiply, never add (1.35 = 35% fee, not $1.35)
- **Balances**: RTR - Total Paid = Current Balance
- **Dates**: UTC in database, local timezone for display
- **Status Flow**: Active → Delinquent (1-7 days) → Collections (7+) → Default
```

---

## Quick Reference

### Running the Midday Sync Agent

```
"Hey Claude, check Midday's GitHub for any new features since our last sync.
Analyze what they've added, rate each for MCA relevance, and generate PRDs
for anything we should adopt. Focus on UI components, dashboard features,
and anything that could improve our merchant portal or collections console."
```

### Running the Design Checker

```
"Review this component for Midday design consistency. Make sure it uses
shadow borders, proper spacing, our color palette, and existing UI primitives."
```

### Running the MCA Reviewer

```
"Review this code for MCA domain correctness. Check that factor rates use
multiplication, money is in cents, balances are calculated correctly, and
status transitions follow our state machine."
```

---

*Last Updated: January 2026*
