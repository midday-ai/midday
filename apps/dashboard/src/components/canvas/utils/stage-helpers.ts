/**
 * Stage-based rendering helpers for canvas components
 */

/**
 * Check if chart should be shown based on stage
 * Chart is shown when stage includes: loading, chart_ready, metrics_ready, or analysis_ready
 */
export function shouldShowChart(stage: string | undefined): boolean {
  if (!stage) return false;
  return ["loading", "chart_ready", "metrics_ready", "analysis_ready"].includes(
    stage,
  );
}

/**
 * Check if summary section should show skeleton
 * Summary skeleton is shown when stage is not analysis_ready
 */
export function shouldShowSummarySkeleton(stage: string | undefined): boolean {
  return !stage || stage !== "analysis_ready";
}

/**
 * Check if metrics section should show skeleton
 * Metrics skeleton is shown when stage is loading or chart_ready
 */
export function shouldShowMetricsSkeleton(stage: string | undefined): boolean {
  return !stage || stage === "loading" || stage === "chart_ready";
}
