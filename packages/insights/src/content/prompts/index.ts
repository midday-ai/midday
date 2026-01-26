/**
 * Focused prompts for split insight generation
 */
export { buildTitlePrompt } from "./title";
export { buildSummaryPrompt } from "./summary";
export { buildStoryPrompt } from "./story";
export { buildActionsPrompt } from "./actions";
export { buildAudioPrompt } from "./audio";
export {
  computeSlots,
  type AnomalySlot,
  type InsightSlots,
  type WeekHighlight,
  type WeekType,
} from "./slots";
export {
  extractFacts,
  getHeadlineFact,
  getPrimaryAction,
  type InsightFacts,
} from "./shared-data";
