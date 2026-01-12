# @midday/insights

AI-powered business insights generation for Midday. This package provides smart metric selection, anomaly detection, and narrative content generation for periodic business summaries.

## Overview

The insights package generates weekly, monthly, quarterly, and yearly business summaries by:

1. **Fetching financial and activity data** from the database
2. **Calculating metrics** with period-over-period comparisons
3. **Selecting the most relevant metrics** using a smart scoring algorithm
4. **Detecting anomalies** (significant changes, low runway, negative profit)
5. **Generating AI-powered narratives** that explain the data in plain language

## Usage

```typescript
import { createInsightsService } from "@midday/insights";
import { db } from "@midday/db/client";

const service = createInsightsService(db);

const result = await service.generateInsight({
  teamId: "team-uuid",
  periodType: "weekly",
  periodStart: new Date("2024-01-08"),
  periodEnd: new Date("2024-01-14"),
  periodLabel: "Week 2, 2024",
  periodYear: 2024,
  periodNumber: 2,
  currency: "USD",
});

// Result contains:
// - selectedMetrics: Top 4 most relevant metrics
// - allMetrics: Full metrics snapshot
// - anomalies: Detected issues/alerts
// - activity: Invoice, time tracking, customer activity
// - content: AI-generated narrative (sentiment, opener, story, actions)
```

## Environment Variables

```bash
# Required for AI content generation
OPENAI_API_KEY=sk-...
```

## Architecture

```
@midday/insights
├── index.ts          # InsightsService + team filtering helpers
├── types.ts          # TypeScript type definitions
├── constants.ts      # Configuration constants
├── schemas.ts        # Zod validation schemas
├── metrics/
│   ├── analyzer.ts   # Smart metric selection + anomaly detection
│   ├── calculator.ts # Metric value calculations
│   └── definitions.ts # Metric metadata (labels, units, categories)
├── content/
│   ├── generator.ts  # AI content generation using OpenAI
│   └── prompts.ts    # Prompt templates
└── period/
    └── utils.ts      # Date range calculations for different periods
```

## Key Concepts

### Smart Metric Selection

Not all metrics are equally important. The `selectTopMetrics()` function scores metrics based on:

- **Priority**: Core financial metrics (revenue, profit) rank higher
- **Data presence**: Metrics with actual data score higher
- **Significant changes**: Large period-over-period changes are prioritized
- **Anomalies**: Low runway or negative profit get boosted
- **Category diversity**: Max 2 metrics from the same category

### Anomaly Detection

The `detectAnomalies()` function identifies:

- Significant increases/decreases (>25% change)
- Low runway warnings (<6 months)
- Negative profit alerts
- Negative cash flow
- Overdue invoices

### Period Types

Supports four period types with automatic date calculations:

- `weekly` - ISO week numbers (1-53)
- `monthly` - Calendar months (1-12)
- `quarterly` - Q1-Q4
- `yearly` - Full year

### Team Filtering (Staging)

For staged rollouts, use the `INSIGHTS_ENABLED_TEAM_IDS` environment variable:

```bash
# Specific teams only
INSIGHTS_ENABLED_TEAM_IDS=uuid-1,uuid-2,uuid-3

# All teams (production)
INSIGHTS_ENABLED_TEAM_IDS=*

# Disabled (default, safe for staging)
INSIGHTS_ENABLED_TEAM_IDS=
```

Check with:

```typescript
import { isTeamEnabledForInsights, getEnabledTeamIds } from "@midday/insights";

if (isTeamEnabledForInsights(teamId)) {
  // Generate insights
}
```

## Testing

```bash
cd packages/insights
bun test
```
