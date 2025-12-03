/**
 * Constants for metrics breakdown tool
 */

/**
 * Create a monthly artifact type from a month key
 */
export function createMonthlyArtifactType(monthKey: string): string {
  return `breakdown-summary-canvas-${monthKey}`;
}
