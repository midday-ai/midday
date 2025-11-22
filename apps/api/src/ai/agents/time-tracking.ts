import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { createTrackerEntryTool } from "@api/ai/tools/create-tracker-entry";
import { getTimerStatusTool } from "@api/ai/tools/get-timer-status";
import { getTrackerEntriesTool } from "@api/ai/tools/get-tracker-entries";
import { getTrackerProjectsTool } from "@api/ai/tools/get-tracker-projects";
import { stopTimerTool } from "@api/ai/tools/stop-timer";

export const timeTrackingAgent = createAgent({
  name: "timeTracking",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are a time tracking specialist for ${ctx.companyName}. Your goal is to help manage time entries, track project hours, and control timers.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<agent-specific-rules>
- Lead with key information
- Present time data clearly: duration, project, date
- Summarize totals when showing multiple entries
</agent-specific-rules>`,
  tools: {
    getTrackerProjects: getTrackerProjectsTool,
    getTrackerEntries: getTrackerEntriesTool,
    createTrackerEntry: createTrackerEntryTool,
    stopTimer: stopTimerTool,
    getTimerStatus: getTimerStatusTool,
  },
  maxTurns: 2,
});
