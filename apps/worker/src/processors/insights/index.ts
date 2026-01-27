import { DispatchInsightsProcessor } from "./dispatch-insights";
import { GenerateInsightsProcessor } from "./generate-team-insights";

/**
 * Export all insights processors (for type imports)
 */
export { DispatchInsightsProcessor } from "./dispatch-insights";
export { GenerateInsightsProcessor } from "./generate-team-insights";

/**
 * Insights processor registry
 * Maps job names to processor instances
 */
export const insightsProcessors = {
  "dispatch-insights": new DispatchInsightsProcessor(),
  "generate-team-insights": new GenerateInsightsProcessor(),
};
