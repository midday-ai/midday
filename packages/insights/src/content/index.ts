/**
 * Content module - AI-powered content generation
 */
export {
  ContentGenerator,
  createContentGenerator,
  type ContentGenerationContext,
  type ContentGeneratorOptions,
  type YearOverYearContext,
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
