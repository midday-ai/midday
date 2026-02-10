/**
 * Focused prompts for split insight generation
 */

export { buildActionsPrompt } from "./actions";
export { buildAudioPrompt } from "./audio";
export {
  extractFacts,
  getHeadlineFact,
  getPrimaryAction,
  type InsightFacts,
} from "./shared-data";
export {
  type AnomalySlot,
  computeSlots,
  type InsightSlots,
  type WeekHighlight,
  type WeekType,
} from "./slots";
export { buildStoryPrompt } from "./story";
export { buildSummaryPrompt } from "./summary";
export { buildTitlePrompt } from "./title";
