# Abacus Strategy & Planning

This folder contains all strategic planning documents for Abacus. Use this as your primary reference for understanding the product vision, migration status, and feature roadmap.

---

## Quick Reference for Agents

When building roadmaps or planning features, reference these documents in this order:

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | [ROADMAP.md](./ROADMAP.md) | **20-week launch roadmap** - weekly sprints, deliverables, milestones |
| 2 | [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Core product strategy, phases, target market, philosophy |
| 3 | [FEATURE_PARITY.md](./FEATURE_PARITY.md) | Detailed feature inventory from Honest Funding/Emmy Capital |
| 4 | [MIGRATION_MASTER.md](./MIGRATION_MASTER.md) | Technical migration status (Midday → Abacus) |
| 5 | [FEATURE_PARITY_AGENTS.md](./FEATURE_PARITY_AGENTS.md) | Agent prompts for feature analysis |
| 6 | [SPRINT_TEMPLATE.md](./SPRINT_TEMPLATE.md) | Template for sprint planning |

---

## Document Summaries

### ROADMAP.md
**The 20-week execution plan**

Aggressive 5-month launch roadmap with weekly sprints:
- 7 phases, 20 one-week sprints
- Goal: 15 customers, $7.5K MRR by Week 20
- Solo developer + Claude Code AI workflow

Key phases:
- Weeks 1-4: Data Foundation (Google Sheets sync)
- Weeks 5-8: Admin Experience (Portfolio dashboard)
- Weeks 9-12: Collections & Stickiness
- Weeks 13-14: Letter Generation
- Weeks 15-16: Access Control & Namespace Migration
- Weeks 17-18: Alerts & Intelligence
- Weeks 19-20: Launch Readiness

Use this as the weekly execution guide. Ask "What's the focus for Week X?" to get specific tasks.

### PRODUCT_VISION.md
**The "why" and "what" of Abacus**

- One-liner: "Your spreadsheet, supercharged"
- Target: Small-to-midsize MCA operators ($5M-$50M annual volume)
- Philosophy: "Push, Don't Pull" - proactive alerts over passive dashboards
- Phases: Wedge → Stickiness → Payments → Underwriting → Full-Stack

Key concepts:
- 5-minute time-to-value
- Merchant Portal as "$50K feature"
- Multi-tenant, configuration-driven architecture
- AI-native (Claude as default provider)

### FEATURE_PARITY.md
**The complete feature inventory**

Comprehensive analysis of features from:
- Honest Funding (primary reference)
- Emmy Capital (delta features)
- Abacus gap analysis

Includes for each feature:
- Priority (P0/P1/P2)
- Phase alignment
- Implementation status
- Push notification opportunities
- Multi-tenant considerations

### MIGRATION_MASTER.md
**Technical migration status**

Tracks the transformation from Midday (freelancer platform) to Abacus (MCA platform):
- Completed: Branding, domains, infrastructure, OAuth
- In Progress: Package namespace (@midday/* → @abacus/*)
- Not Started: Domain model transformation (customers → merchants, invoices → MCAs)

Key stats:
- 956 files with @midday/* imports to update
- ~20 files with midday.ai domain references
- 43 database tables, 13 integrations to keep

### FEATURE_PARITY_AGENTS.md
**Agent prompts for feature analysis**

12 enhanced agent prompts (17-28) for analyzing features:
- Agents 17-19: Foundation (extraction, deltas, gaps)
- Agents 20-26: Current feature specs
- Agents 27-28: Future phase research (Payments, Underwriting)

Each agent spawns 2-3 sub-agents for parallel exploration.

### SPRINT_TEMPLATE.md
**Sprint planning template**

Structured approach for development sprints:
- Every sprint produces demoable software
- Tasks must be atomic, commitable, testable
- Includes validation criteria templates
- Example sprint with risk scoring feature

---

## Key Strategic Decisions

### AI Provider Strategy
- **Default**: Claude (sonnet for most tasks, haiku for fast, opus for complex)
- **Embeddings**: Google Gemini (Claude doesn't offer embeddings)
- **Fallback**: OpenAI when needed
- **Approach**: Configurable via environment variables

### Product Phases
```
Phase 1: WEDGE (Q1-Q2 2025)
├─ Spreadsheet sync + Dashboard
├─ AI-powered onboarding
└─ Get in door with zero friction

Phase 2: STICKINESS (Q3-Q4 2025)
├─ Merchant Portal
├─ Risk scoring + Alerts
└─ Collections workflow

Phase 3: PAYMENTS & BANKING (2026 H1)
├─ Payment processing through portal
├─ Bank connections (Plaid)
└─ Auto-reconciliation

Phase 4: UNDERWRITING (2026 H2)
├─ AI underwriting engine
├─ Document extraction
└─ Stacking detection
```

### Priority Framework
- **P0**: Launch blocker - must have for MVP
- **P1**: Must-have - required for production readiness
- **P2**: Nice-to-have - can defer to later phases

---

## For Roadmap Agents

When creating a roadmap, consider:

1. **Phase alignment** - Features should align with product phases
2. **Dependencies** - Migration tasks may block feature development
3. **Push opportunities** - Every feature should have proactive notifications
4. **Multi-tenant** - All features must work across different MCA operators
5. **AI integration** - Use Claude for reasoning, Gemini for embeddings

Start by reading PRODUCT_VISION.md for context, then FEATURE_PARITY.md for specific features, and MIGRATION_MASTER.md for technical constraints.
