/**
 * Constants for metrics breakdown tool
 */

export const METRICS_BREAKDOWN_ARTIFACT_TYPE = "breakdown-summary-canvas";

/**
 * Create a monthly artifact type from a month key
 */
export function createMonthlyArtifactType(monthKey: string): string {
  return `${METRICS_BREAKDOWN_ARTIFACT_TYPE}-${monthKey}`;
}
