# MCA Metrics Tab Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 7 generic financial charts in the Metrics tab with 7 MCA-specific analytics charts, using mock data.

**Architecture:** Content swap within the existing `MetricsView` → `MetricsGrid` → card component framework. Each chart has 3 layers: (1) a tRPC endpoint returning mock data, (2) a Recharts chart component, (3) a metrics card component. No layout, drag-and-drop, or filter infrastructure changes.

**Tech Stack:** React, TypeScript, Recharts, tRPC, Zod, Tanstack Query, Tailwind CSS

---

### Task 1: Update chart type registry

**Files:**
- Modify: `apps/dashboard/src/components/metrics/utils/chart-types.ts`

**Step 1: Replace chart IDs, report types, display names, and mappings**

Replace the entire file contents with:

```typescript
// Chart type identifiers
export type ChartId =
  | "collection-performance"
  | "funding-activity"
  | "portfolio-composition"
  | "factor-rate-returns"
  | "rtr-aging"
  | "nsf-default-trends"
  | "repayment-velocity";

// Report types for database storage
export type ReportType =
  | "collection_performance"
  | "funding_activity"
  | "portfolio_composition"
  | "factor_rate_returns"
  | "rtr_aging"
  | "nsf_default_trends"
  | "repayment_velocity";

// Default chart order matching current layout
export const DEFAULT_CHART_ORDER: ChartId[] = [
  "collection-performance",
  "funding-activity",
  "portfolio-composition",
  "factor-rate-returns",
  "rtr-aging",
  "nsf-default-trends",
  "repayment-velocity",
];

// Mapping from ChartId to ReportType
const chartToReportMap: Record<ChartId, ReportType> = {
  "collection-performance": "collection_performance",
  "funding-activity": "funding_activity",
  "portfolio-composition": "portfolio_composition",
  "factor-rate-returns": "factor_rate_returns",
  "rtr-aging": "rtr_aging",
  "nsf-default-trends": "nsf_default_trends",
  "repayment-velocity": "repayment_velocity",
};

// Mapping from ReportType to ChartId
const reportToChartMap: Record<ReportType, ChartId> = {
  collection_performance: "collection-performance",
  funding_activity: "funding-activity",
  portfolio_composition: "portfolio-composition",
  factor_rate_returns: "factor-rate-returns",
  rtr_aging: "rtr-aging",
  nsf_default_trends: "nsf-default-trends",
  repayment_velocity: "repayment-velocity",
};

// Display names for chart types
const chartDisplayNames: Record<ReportType, string> = {
  collection_performance: "Collection Performance",
  funding_activity: "Funding Activity",
  portfolio_composition: "Portfolio Composition",
  factor_rate_returns: "Factor Rate Returns",
  rtr_aging: "RTR Aging",
  nsf_default_trends: "NSF & Default Trends",
  repayment_velocity: "Repayment Velocity",
};

export function chartTypeToReportType(chartId: ChartId): ReportType {
  return chartToReportMap[chartId];
}

export function reportTypeToChartType(reportType: ReportType): ChartId {
  return reportToChartMap[reportType];
}

export function getChartDisplayName(reportType: ReportType): string {
  return chartDisplayNames[reportType];
}
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/metrics/utils/chart-types.ts
git commit -m "refactor: replace generic chart types with MCA chart types"
```

---

### Task 2: Add MCA report schemas and tRPC mock endpoints

**Files:**
- Modify: `apps/api/src/schemas/reports.ts` (add new schemas, update `reportTypeSchema`)
- Modify: `apps/api/src/trpc/routers/reports.ts` (add 7 mock endpoints)

**Step 1: Add Zod schemas for MCA report inputs**

Append to `apps/api/src/schemas/reports.ts`, before the closing of the file. All 7 use the same simple `{ from, to, currency? }` shape. Add a single shared schema:

```typescript
export const getMcaReportSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2025-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2025-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
  })
  .openapi("GetMcaReportSchema");
```

Also update the `reportTypeSchema` enum to include the new MCA types:

```typescript
export const reportTypeSchema = z.enum([
  "profit",
  "revenue",
  "burn_rate",
  "expense",
  "monthly_revenue",
  "revenue_forecast",
  "runway",
  "category_expenses",
  "collection_performance",
  "funding_activity",
  "portfolio_composition",
  "factor_rate_returns",
  "rtr_aging",
  "nsf_default_trends",
  "repayment_velocity",
]);
```

**Step 2: Create mock data generator file**

Create: `apps/api/src/trpc/mocks/mca-metrics-mock.ts`

This file contains 7 pure functions that generate realistic MCA mock data given a `from`/`to` date range. Each generates monthly data points between the date range.

```typescript
import { eachMonthOfInterval, format, parseISO, differenceInDays } from "date-fns";

function generateMonths(from: string, to: string) {
  const months = eachMonthOfInterval({
    start: parseISO(from),
    end: parseISO(to),
  });
  return months.map((m) => format(m, "yyyy-MM-dd"));
}

// Seeded pseudo-random for deterministic mock data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function mockCollectionPerformance(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(42);
  let totalCollected = 0;
  let totalExpected = 0;

  const result = months.map((date) => {
    const expected = 80000 + rand() * 40000;
    const rate = 0.82 + rand() * 0.15;
    const collected = expected * rate;
    totalCollected += collected;
    totalExpected += expected;
    return {
      date,
      collected: Math.round(collected),
      expected: Math.round(expected),
      collectionRate: Math.round(rate * 1000) / 10,
    };
  });

  return {
    summary: { totalCollected: Math.round(totalCollected), totalExpected: Math.round(totalExpected) },
    result,
  };
}

export function mockFundingActivity(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(137);
  let totalFunded = 0;

  const result = months.map((date) => {
    const dealCount = Math.floor(2 + rand() * 5);
    const avgDealSize = 25000 + rand() * 30000;
    const funded = dealCount * avgDealSize;
    totalFunded += funded;
    return {
      date,
      funded: Math.round(funded),
      dealCount,
      avgDealSize: Math.round(avgDealSize),
    };
  });

  return {
    summary: { totalFunded: Math.round(totalFunded) },
    result,
  };
}

export function mockPortfolioComposition(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(256);

  const result = months.map((date, i) => {
    const base = 8 + i;
    const active = Math.max(1, Math.floor(base * (0.5 + rand() * 0.2)));
    const late = Math.floor(base * (0.08 + rand() * 0.08));
    const defaulted = Math.floor(base * (0.03 + rand() * 0.04));
    const paidOff = Math.floor(base * (0.2 + rand() * 0.15));
    const paused = Math.floor(base * (0.02 + rand() * 0.03));
    return { date, active, late, defaulted, paidOff, paused };
  });

  const latest = result[result.length - 1]!;
  return {
    summary: { activeDeals: latest.active, totalDeals: latest.active + latest.late + latest.defaulted + latest.paidOff + latest.paused },
    result,
  };
}

export function mockFactorRateReturns(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(314);
  let totalRevenue = 0;

  const result = months.map((date) => {
    const funded = 100000 + rand() * 150000;
    const factorRate = 1.25 + rand() * 0.2;
    const payback = funded * factorRate;
    const revenue = payback - funded;
    totalRevenue += revenue;
    return {
      date,
      revenue: Math.round(revenue),
      funded: Math.round(funded),
      avgFactorRate: Math.round(factorRate * 100) / 100,
    };
  });

  return {
    summary: { totalRevenue: Math.round(totalRevenue) },
    result,
  };
}

export function mockRtrAging(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(512);
  let totalOutstanding = 0;

  const result = months.map((date) => {
    const bucket0to30 = 120000 + rand() * 80000;
    const bucket31to60 = 60000 + rand() * 50000;
    const bucket61to90 = 20000 + rand() * 30000;
    const bucket90plus = 10000 + rand() * 20000;
    const total = bucket0to30 + bucket31to60 + bucket61to90 + bucket90plus;
    totalOutstanding = total; // latest snapshot
    return {
      date,
      "0-30": Math.round(bucket0to30),
      "31-60": Math.round(bucket31to60),
      "61-90": Math.round(bucket61to90),
      "90+": Math.round(bucket90plus),
    };
  });

  return {
    summary: { totalOutstanding: Math.round(totalOutstanding) },
    result,
  };
}

export function mockNsfDefaultTrends(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(777);
  let totalNsf = 0;

  const result = months.map((date) => {
    const nsfCount = Math.floor(rand() * 12);
    const defaultRate = 2 + rand() * 6;
    totalNsf += nsfCount;
    return {
      date,
      nsfCount,
      defaultRate: Math.round(defaultRate * 10) / 10,
    };
  });

  return {
    summary: { totalNsf },
    result,
  };
}

export function mockRepaymentVelocity(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(999);

  const result = months.map((date) => {
    const expectedDays = 120 + Math.floor(rand() * 40);
    const actualDays = expectedDays + Math.floor((rand() - 0.4) * 30);
    return {
      date,
      actualDays,
      expectedDays,
    };
  });

  const avgActual = Math.round(result.reduce((s, r) => s + r.actualDays, 0) / result.length);
  return {
    summary: { avgDaysToPayoff: avgActual },
    result,
  };
}
```

**Step 3: Add 7 tRPC endpoints to the reports router**

In `apps/api/src/trpc/routers/reports.ts`, add imports and endpoints:

```typescript
// Add import at top
import { getMcaReportSchema } from "@api/schemas/reports";
import {
  mockCollectionPerformance,
  mockFundingActivity,
  mockPortfolioComposition,
  mockFactorRateReturns,
  mockRtrAging,
  mockNsfDefaultTrends,
  mockRepaymentVelocity,
} from "@api/trpc/mocks/mca-metrics-mock";

// Add these 7 endpoints inside the router (before the `create` mutation):
  collectionPerformance: protectedProcedure
    .input(getMcaReportSchema)
    .query(async ({ input }) => {
      return mockCollectionPerformance(input.from, input.to);
    }),

  fundingActivity: protectedProcedure
    .input(getMcaReportSchema)
    .query(async ({ input }) => {
      return mockFundingActivity(input.from, input.to);
    }),

  portfolioComposition: protectedProcedure
    .input(getMcaReportSchema)
    .query(async ({ input }) => {
      return mockPortfolioComposition(input.from, input.to);
    }),

  factorRateReturns: protectedProcedure
    .input(getMcaReportSchema)
    .query(async ({ input }) => {
      return mockFactorRateReturns(input.from, input.to);
    }),

  rtrAging: protectedProcedure
    .input(getMcaReportSchema)
    .query(async ({ input }) => {
      return mockRtrAging(input.from, input.to);
    }),

  nsfDefaultTrends: protectedProcedure
    .input(getMcaReportSchema)
    .query(async ({ input }) => {
      return mockNsfDefaultTrends(input.from, input.to);
    }),

  repaymentVelocity: protectedProcedure
    .input(getMcaReportSchema)
    .query(async ({ input }) => {
      return mockRepaymentVelocity(input.from, input.to);
    }),
```

**Step 4: Commit**

```bash
git add apps/api/src/schemas/reports.ts apps/api/src/trpc/routers/reports.ts apps/api/src/trpc/mocks/mca-metrics-mock.ts
git commit -m "feat: add MCA metrics mock data endpoints"
```

---

### Task 3: Create 7 Recharts chart components

**Files:**
- Create: `apps/dashboard/src/components/charts/collection-performance-chart.tsx`
- Create: `apps/dashboard/src/components/charts/funding-activity-chart.tsx`
- Create: `apps/dashboard/src/components/charts/portfolio-composition-chart.tsx`
- Create: `apps/dashboard/src/components/charts/factor-rate-returns-chart.tsx`
- Create: `apps/dashboard/src/components/charts/rtr-aging-chart.tsx`
- Create: `apps/dashboard/src/components/charts/nsf-default-trends-chart.tsx`
- Create: `apps/dashboard/src/components/charts/repayment-velocity-chart.tsx`

All charts follow the same pattern as existing chart components (e.g., `burn-rate-chart.tsx`):
- Use `ResponsiveContainer` from Recharts
- Use `ComposedChart` from Recharts for mixed chart types
- Use the project's `commonChartConfig` and `createCompactTickFormatter` from `chart-utils.ts`
- Use `SelectableChartWrapper` if chart selection is desired
- Accept `data`, `height`, `currency`, `locale` props at minimum
- Use CSS vars for chart colors: `var(--chart-axis-text)`, `var(--chart-grid-stroke)`

Each chart's specific implementation:

**1. Collection Performance Chart** — Area chart with two areas (collected/expected) + a rate % line on right Y-axis.

**2. Funding Activity Chart** — Bar chart for $ funded + Line for deal count on right Y-axis.

**3. Portfolio Composition Chart** — Stacked area chart with 5 status series (active, late, defaulted, paidOff, paused).

**4. Factor Rate Returns Chart** — Bar chart for revenue + dashed Line for avg factor rate on right Y-axis.

**5. RTR Aging Chart** — Stacked bar chart with 4 age buckets (0-30, 31-60, 61-90, 90+).

**6. NSF & Default Trends Chart** — Bar for NSF count + Line for default rate % on right Y-axis.

**7. Repayment Velocity Chart** — Two lines: actual days (solid) and expected days (dashed).

Color scheme reference (from CLAUDE.md palette):
- Primary: `#0ea5e9` (sky blue)
- Secondary: `#f97316` (orange)
- Success: `#16a34a` (green)
- Warning: `#d97706` (amber)
- Danger: `#dc2626` (red)
- Use `hsl(var(--foreground))` for primary series, `hsl(var(--muted-foreground))` for secondary.

For stacked charts, use these colors:
- Active: `#0ea5e9`
- Late: `#d97706`
- Defaulted: `#dc2626`
- Paid Off: `#16a34a`
- Paused: `#9ca3af`

For RTR aging:
- 0-30: `#0ea5e9`
- 31-60: `#d97706`
- 61-90: `#f97316`
- 90+: `#dc2626`

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/charts/collection-performance-chart.tsx apps/dashboard/src/components/charts/funding-activity-chart.tsx apps/dashboard/src/components/charts/portfolio-composition-chart.tsx apps/dashboard/src/components/charts/factor-rate-returns-chart.tsx apps/dashboard/src/components/charts/rtr-aging-chart.tsx apps/dashboard/src/components/charts/nsf-default-trends-chart.tsx apps/dashboard/src/components/charts/repayment-velocity-chart.tsx
git commit -m "feat: add 7 MCA Recharts chart components"
```

---

### Task 4: Create 7 metrics card components

**Files:**
- Create: `apps/dashboard/src/components/metrics/cards/collection-performance-card.tsx`
- Create: `apps/dashboard/src/components/metrics/cards/funding-activity-card.tsx`
- Create: `apps/dashboard/src/components/metrics/cards/portfolio-composition-card.tsx`
- Create: `apps/dashboard/src/components/metrics/cards/factor-rate-returns-card.tsx`
- Create: `apps/dashboard/src/components/metrics/cards/rtr-aging-card.tsx`
- Create: `apps/dashboard/src/components/metrics/cards/nsf-default-trends-card.tsx`
- Create: `apps/dashboard/src/components/metrics/cards/repayment-velocity-card.tsx`

Each card follows the exact pattern of existing cards (e.g., `burn-rate-card.tsx`):

```
<div className="border bg-background border-border p-6 flex flex-col h-full relative group" {...longPressHandlers}>
  <div className="mb-4 min-h-[140px]">
    <div className="flex items-start justify-between h-7">
      <h3 className="text-sm font-normal text-muted-foreground">{title}</h3>
      <ShareMetricButton ... />
    </div>
    <p className="text-3xl font-normal mb-3">
      <AnimatedNumber value={heroKpi} ... />
    </p>
    <div className="flex items-center gap-4 mt-2">
      {/* Legend items */}
    </div>
  </div>
  <div className="h-80">
    <ChartComponent data={...} height={320} ... />
  </div>
</div>
```

**Props interface** (same for all cards):
```typescript
interface CardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}
```

**Data fetching pattern** (same for all):
```typescript
const trpc = useTRPC();
const { data } = useQuery(
  trpc.reports.<endpointName>.queryOptions({ from, to, currency })
);
```

**Card-specific details:**

| Card | Title | Hero KPI | Hero Format | tRPC endpoint | Legend |
|------|-------|----------|-------------|---------------|--------|
| collection-performance | Collection Performance | `summary.totalCollected` | currency | `collectionPerformance` | Collected (solid) / Expected (dashed) / Rate % (line) |
| funding-activity | Funding Activity | `summary.totalFunded` | currency | `fundingActivity` | Amount Funded (solid) / Deal Count (line) |
| portfolio-composition | Portfolio Composition | `summary.activeDeals` | number (no currency) | `portfolioComposition` | Active / Late / Defaulted / Paid Off / Paused (colored squares) |
| factor-rate-returns | Factor Rate Returns | `summary.totalRevenue` | currency | `factorRateReturns` | Revenue (solid) / Avg Factor Rate (dashed) |
| rtr-aging | RTR Aging | `summary.totalOutstanding` | currency | `rtrAging` | 0-30 / 31-60 / 61-90 / 90+ (colored squares) |
| nsf-default-trends | NSF & Default Trends | `summary.totalNsf` | number (no currency) | `nsfDefaultTrends` | NSF Count (solid) / Default Rate % (line) |
| repayment-velocity | Repayment Velocity | `summary.avgDaysToPayoff` | number + " days" suffix | `repaymentVelocity` | Actual Days (solid) / Expected Days (dashed) |

For hero KPIs that are NOT currency: use plain `<AnimatedNumber value={n} />` without `currency` prop, or format manually.

For hero KPIs that ARE currency: use `<AnimatedNumber value={n} currency={currency || "USD"} locale={locale} maximumFractionDigits={0} />`.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/metrics/cards/collection-performance-card.tsx apps/dashboard/src/components/metrics/cards/funding-activity-card.tsx apps/dashboard/src/components/metrics/cards/portfolio-composition-card.tsx apps/dashboard/src/components/metrics/cards/factor-rate-returns-card.tsx apps/dashboard/src/components/metrics/cards/rtr-aging-card.tsx apps/dashboard/src/components/metrics/cards/nsf-default-trends-card.tsx apps/dashboard/src/components/metrics/cards/repayment-velocity-card.tsx
git commit -m "feat: add 7 MCA metrics card components"
```

---

### Task 5: Wire up MetricsView to use new components

**Files:**
- Modify: `apps/dashboard/src/components/metrics/metrics-view.tsx`

**Step 1: Replace imports and switch cases**

Replace the 7 old card imports with:
```typescript
import { CollectionPerformanceCard } from "./cards/collection-performance-card";
import { FundingActivityCard } from "./cards/funding-activity-card";
import { PortfolioCompositionCard } from "./cards/portfolio-composition-card";
import { FactorRateReturnsCard } from "./cards/factor-rate-returns-card";
import { RtrAgingCard } from "./cards/rtr-aging-card";
import { NsfDefaultTrendsCard } from "./cards/nsf-default-trends-card";
import { RepaymentVelocityCard } from "./cards/repayment-velocity-card";
```

Replace the switch statement in `renderChart`:
```typescript
switch (chartId) {
  case "collection-performance":
    return <CollectionPerformanceCard {...commonProps} />;
  case "funding-activity":
    return <FundingActivityCard {...commonProps} />;
  case "portfolio-composition":
    return <PortfolioCompositionCard {...commonProps} />;
  case "factor-rate-returns":
    return <FactorRateReturnsCard {...commonProps} />;
  case "rtr-aging":
    return <RtrAgingCard {...commonProps} />;
  case "nsf-default-trends":
    return <NsfDefaultTrendsCard {...commonProps} />;
  case "repayment-velocity":
    return <RepaymentVelocityCard {...commonProps} />;
  default:
    return null;
}
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/metrics/metrics-view.tsx
git commit -m "feat: wire MCA chart cards into MetricsView"
```

---

### Task 6: Update chart-utils.ts with MCA chart type names

**Files:**
- Modify: `apps/dashboard/src/components/charts/chart-utils.ts`

**Step 1: Update `getChartTypeName` map**

In `chart-utils.ts`, replace the `chartTypeMap` inside `getChartTypeName` with:

```typescript
const chartTypeMap: Record<string, string> = {
  "collection-performance": "collection performance",
  "funding-activity": "funding activity",
  "portfolio-composition": "portfolio composition",
  "factor-rate-returns": "factor rate returns",
  "rtr-aging": "RTR aging",
  "nsf-default-trends": "NSF & default trends",
  "repayment-velocity": "repayment velocity",
  // Keep any still-referenced legacy entries
  "monthly-revenue": "revenue",
  revenue: "revenue",
  profit: "profit",
  "burn-rate": "burn rate",
  expenses: "expenses",
  "revenue-forecast": "revenue forecast",
  runway: "runway",
  "category-expenses": "category expenses",
  "stacked-bar": "expenses",
  "revenue-trend": "revenue trends",
  "cash-flow": "cash flow",
  "growth-rate": "growth rate",
  "business-health-score": "business health score",
  "invoice-payment": "invoice payments",
  "tax-trend": "tax trends",
  "stress-test": "cash flow stress test",
};
```

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/charts/chart-utils.ts
git commit -m "feat: add MCA chart type names to chart-utils"
```

---

### Task 7: Delete old chart card files (cleanup)

**Files:**
- Delete: `apps/dashboard/src/components/metrics/cards/monthly-revenue-card.tsx`
- Delete: `apps/dashboard/src/components/metrics/cards/burn-rate-card.tsx`
- Delete: `apps/dashboard/src/components/metrics/cards/expenses-card.tsx`
- Delete: `apps/dashboard/src/components/metrics/cards/profit-card.tsx`
- Delete: `apps/dashboard/src/components/metrics/cards/revenue-forecast-card.tsx`
- Delete: `apps/dashboard/src/components/metrics/cards/runway-card.tsx`
- Delete: `apps/dashboard/src/components/metrics/cards/category-expenses-card.tsx`

**Step 1: Remove the old card files**

```bash
rm apps/dashboard/src/components/metrics/cards/monthly-revenue-card.tsx
rm apps/dashboard/src/components/metrics/cards/burn-rate-card.tsx
rm apps/dashboard/src/components/metrics/cards/expenses-card.tsx
rm apps/dashboard/src/components/metrics/cards/profit-card.tsx
rm apps/dashboard/src/components/metrics/cards/revenue-forecast-card.tsx
rm apps/dashboard/src/components/metrics/cards/runway-card.tsx
rm apps/dashboard/src/components/metrics/cards/category-expenses-card.tsx
```

**Step 2: Verify no remaining imports reference the old cards**

```bash
grep -r "MonthlyRevenueCard\|BurnRateCard\|ExpensesCard\|ProfitCard\|RevenueForecastCard\|RunwayCard\|CategoryExpensesCard" apps/dashboard/src/components/metrics/ --include="*.tsx" --include="*.ts"
```

Expected: no results (all references should have been replaced in Task 5).

**Step 3: Commit**

```bash
git add -u apps/dashboard/src/components/metrics/cards/
git commit -m "chore: remove old generic metrics card components"
```

---

### Task 8: Build verification

**Step 1: Run TypeScript check**

```bash
cd apps/dashboard && bunx tsc --noEmit
```

Expected: no type errors.

**Step 2: Run lint**

```bash
bun lint
```

Expected: no lint errors in changed files.

**Step 3: If errors, fix and commit**

```bash
git add -A && git commit -m "fix: resolve build errors from MCA metrics overhaul"
```
