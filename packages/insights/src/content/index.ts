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

export { getFallbackContent } from "./prompts";

export {
  buildActionsPrompt,
  buildAudioPrompt,
  buildStoryPrompt,
  buildSummaryPrompt,
  buildTitlePrompt,
  computeSlots,
  type AnomalySlot,
  type InsightSlots,
  type WeekHighlight,
  type WeekType,
} from "./prompts/index";
