/**
 * Content module - AI-powered content generation
 */
export {
  ContentGenerator,
  createContentGenerator,
  type ContentGeneratorOptions,
} from "./generator";

export {
  buildInsightPrompt,
  formatAnomaliesContext,
  formatExpenseAnomaliesContext,
  formatMetricsContext,
  formatOverdueContext,
  formatUpcomingInvoicesContext,
  getFallbackContent,
  getPeriodName,
} from "./prompts";
