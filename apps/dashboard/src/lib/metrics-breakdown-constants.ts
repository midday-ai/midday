/**
 * Constants for metrics breakdown artifacts
 */

export const METRICS_BREAKDOWN_MONTHLY_PATTERN =
  /^breakdown-summary-canvas-\d{4}-\d{2}$/;

/**
 * Check if an artifact type is a monthly breakdown
 */
export function isMonthlyBreakdownType(type: string): boolean {
  return METRICS_BREAKDOWN_MONTHLY_PATTERN.test(type);
}

/**
 * Get the base artifact type (removes monthly suffix)
 */
export function getBaseBreakdownType(type: string): string {
  if (isMonthlyBreakdownType(type)) {
    return "breakdown-summary-canvas";
  }
  return type;
}
