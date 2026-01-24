/**
 * Focused prompts for split insight generation
 */
export { buildTitlePrompt } from "./title";
export { buildSummaryPrompt } from "./summary";
export { buildStoryPrompt } from "./story";
export { buildActionsPrompt } from "./actions";
export {
  computeSlots,
  type InsightSlots,
  type WeekHighlight,
  type WeekType,
} from "./slots";
