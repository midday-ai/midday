/**
 * Content module - AI-powered content generation
 */
export {
  type ContentGenerationContext,
  ContentGenerator,
  type ContentGeneratorOptions,
  createContentGenerator,
  type YearOverYearContext,
} from "./generator";

export { getFallbackContent } from "./prompts";

export {
  type AnomalySlot,
  buildActionsPrompt,
  buildAudioPrompt,
  buildStoryPrompt,
  buildSummaryPrompt,
  buildTitlePrompt,
  computeSlots,
  type InsightSlots,
  type WeekHighlight,
  type WeekType,
} from "./prompts/index";
