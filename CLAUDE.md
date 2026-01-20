# Abacus - AI Agent Guide

This document provides essential context for AI agents working on the Abacus codebase.

---

## What is Abacus?

**Abacus is the operating system for Merchant Cash Advance (MCA) businesses.**

### Core Identity
- **Fork of Midday**: Abacus is forked from [Midday](https://midday.ai), an open-source platform for freelancers. We repurpose its infrastructure for MCA portfolio management.
- **Target Market**: Small-to-midsize MCA operators ($5M-$50M annual funding volume, 1-10 person teams)
- **Core Value Proposition**: "Your spreadsheet, supercharged" — connect your Google Sheet and get a professional dashboard, risk alerts, and branded merchant portal in 5 minutes

### The "Push, Don't Pull" Philosophy
Abacus proactively surfaces information rather than requiring users to dig for it:
- Weekly portfolio summaries delivered to inbox
- Real-time alerts for NSFs, late payments, risk changes
- "3 merchants need attention" instead of passive dashboards

### MCA Terminology Quick Reference
| Term | Definition |
|------|------------|
| **MCA** | Merchant Cash Advance — Purchase of future receivables |
| **Factor Rate** | Multiplier on principal (e.g., 1.35 = pay back $1.35 per $1 funded) |
| **RTR** | Right to Receivables — Legal claim to future payments |
| **NSF** | Non-Sufficient Funds — Bounced payment |
| **ISO** | Independent Sales Organization — Broker who originates deals |
| **Stacking** | Merchant has multiple MCAs simultaneously |

---

## Design Standards

### Aesthetic Reference
Abacus MUST match Midday's UX/UI aesthetic. The design language draws from:
- **Mercury** (mercury.com) — Clean, trustworthy fintech design
- **Ramp** (ramp.com) — Modern expense management aesthetic
- **Linear** (linear.app) — Information-dense but elegant UI

### Design Principles
1. **Shadow borders, not hard borders** — Softer visual hierarchy
2. **Generous whitespace** — Breathing room, not cramped
3. **Data-dense but not cluttered** — Show what matters, hide what doesn't
4. **Light mode default** — Professional, clean appearance

### UI Component Library
- **Location**: `packages/ui/`
- **Stack**: Radix UI primitives + Tailwind CSS
- **Pattern**: Use existing components from the UI package before creating new ones

### Color Palette
| Purpose | Color | Hex |
|---------|-------|-----|
| Primary | Sky blue | #0ea5e9 |
| Secondary | Orange | #f97316 |
| Success | Green | #16a34a |
| Warning | Amber | #d97706 |
| Danger | Red | #dc2626 |
| Background | White/Light gray | #ffffff / #f8fafc |
| Text | Dark gray | #0f172a |

### Typography
- **UI Text**: Inter (sans-serif)
- **Numbers/Data**: JetBrains Mono (monospace)

---

## Required Agent Workflows

When working on Abacus, use these agent workflows in sequence:

### 1. writing-plans (BEFORE implementation)
**When**: Before any multi-step task or feature implementation
**Purpose**: Create a structured implementation plan
**How**: Use the `superpowers:writing-plans` skill

### 2. systematic-debugging (WHEN encountering bugs)
**When**: Upon encountering ANY bug, test failure, or unexpected behavior
**Purpose**: Methodically diagnose root cause before proposing fixes
**How**: Use the `superpowers:systematic-debugging` skill

### 3. code-reviewer (AFTER implementation)
**When**: After completing a feature or significant code change
**Purpose**: Review implementation against plan and coding standards
**How**: Use the `superpowers:code-reviewer` agent via Task tool

### Workflow Sequence
```
Plan → Implement → Review → Commit
  │         │         │
  │         │         └── code-reviewer agent
  │         └── (if bugs: systematic-debugging)
  └── writing-plans skill
```

---

## Sprint Planning

### Sprint Structure
Every sprint should produce **demoable software**. Use the template at `docs/spec.md` for planning.

### Task Requirements
Every task must be:
- **Atomic**: Single, focused unit of work
- **Commitable**: Can be committed independently
- **Testable**: Has clear validation criteria

### Sprint Planning Process
1. Define a clear, demoable sprint goal
2. Break down into atomic tasks using `docs/spec.md` template
3. Each task specifies validation criteria
4. After sprint completion, submit to code-reviewer agent

---

## Upstream Sync (Midday)

Abacus is a fork of Midday. Periodically sync to incorporate relevant improvements.

### Weekly Check Process
```bash
# Add Midday as upstream remote (one-time setup)
git remote add upstream https://github.com/midday-ai/midday.git

# Fetch latest from Midday
git fetch upstream

# View unmerged commits
git log HEAD..upstream/main --oneline
```

### Sync Decision Criteria
For each upstream commit, ask:
1. **Is it MCA-relevant?** — UI improvements, bug fixes, infrastructure → likely yes
2. **Does it conflict with MCA features?** — Freelancer-specific features → likely skip
3. **Is it worth the merge effort?** — Small fixes → merge; large refactors → evaluate carefully

### Current Status
- Only 2 unmerged commits from Midday (both documentation changes for OAuth and docs system)
- Not MCA-critical; can be skipped or selectively merged

---

## Technical Architecture

### Stack Overview
| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Tailwind CSS + Shadcn/UI |
| Framework | Next.js (App Router) |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Hosting | Vercel (Frontend) + Supabase Cloud (Backend) |
| Background Jobs | Trigger.dev |
| Email | Resend |
| AI | Claude API |

### Monorepo Structure
```
apps/
  dashboard/     # Main Next.js application
  website/       # Marketing site
packages/
  ui/            # Shared UI components (Radix + Tailwind)
  supabase/      # Database types, migrations, functions
```

### Multi-Tenant Model
- Single codebase, single database
- Data isolated by `org_id` with Row Level Security (RLS)
- Configuration-driven per customer (column mappings, features, branding)

---

## Available MCP Tools & CLIs

This project has MCP (Model Context Protocol) servers and CLIs configured. **Always prefer these tools over manual alternatives.**

### Database & Backend
| Tool | Use For | When |
|------|---------|------|
| **Supabase MCP** | Execute SQL, apply migrations, view logs, deploy edge functions | Remote/cloud operations |
| **Supabase MCP** | Generate TypeScript types, search docs, security advisors | Cloud schema introspection |
| **Supabase CLI** | `supabase start/stop`, local development | Local development |
| **Supabase CLI** | `supabase db diff`, `supabase migration new` | Creating new migrations |

### Payments & Financial
| Tool | Use For | Instead Of |
|------|---------|------------|
| **Stripe MCP** | Create products, prices, customers, payment links | Stripe Dashboard or API calls |
| **Stripe MCP** | Search documentation, list resources | Manual Stripe docs lookup |
| **Plaid MCP** | Sandbox access tokens, webhook simulation | Manual Plaid API setup |
| **Plaid MCP** | Search Plaid documentation | Manual docs lookup |

### Deployment & Hosting
| Tool | Use For | Instead Of |
|------|---------|------------|
| **Vercel CLI** | Deploy, view logs, project setup | Vercel Dashboard |
| **GitHub CLI (`gh`)** | PRs, issues, repo operations | GitHub web interface |

### When to Use Each

```
Remote database work?  → Supabase MCP (execute_sql, apply_migration, get_logs)
Local database work?   → Supabase CLI (supabase start, supabase db diff)
New migration needed?  → Supabase CLI (supabase migration new, supabase db diff)
Payment integration?   → Stripe MCP (create_product, create_price, search_documentation)
Bank connections?      → Plaid MCP (get_sandbox_access_token, search_documentation)
Deploy to production?  → Vercel CLI (vercel deploy, vercel logs)
Git/PR operations?     → GitHub CLI (gh pr create, gh issue list)
```

### Important
- **Supabase MCP vs CLI**: MCP for cloud operations, CLI for local dev and creating migrations
- **Stripe MCP** has documentation search — use it before guessing API patterns
- **Plaid MCP** has mock data generation — use for testing without real bank accounts
- **GitHub CLI** is preferred for all PR and issue operations

---

## CLI & Development

### Running with Permissions
For automated workflows that require file operations:
```bash
claude --dangerously-skip-permissions
```
**Use sparingly** — only when running trusted, planned operations.

### Common Commands
```bash
# Development
bun dev                    # Start development server
bun build                  # Build for production
bun test                   # Run tests

# Database
supabase db push           # Push migrations
supabase gen types         # Generate TypeScript types

# Linting
bun lint                   # Run ESLint
bun format                 # Run Prettier
```

### Dangerous Commands to Avoid
- **Never run `taskkill //IM node.exe`** — This kills all Node.js processes including Claude Code itself, causing the session to freeze

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `PRODUCT_VISION.md` | Full product vision, roadmap, and strategy |
| `docs/spec.md` | Sprint planning template |
| `packages/ui/` | Shared UI component library |
| `apps/dashboard/` | Main application |
| `supabase/` | Database schema and migrations |
| `.claude/settings.local.json` | Claude Code permissions |

---

*For full product context, see `PRODUCT_VISION.md`*
