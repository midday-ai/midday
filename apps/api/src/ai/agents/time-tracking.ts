import { openai } from "@ai-sdk/openai";
// import {
//   createTimeEntryTool,
//   deleteTimeEntryTool,
//   getTimeEntriesTool,
//   getTrackerProjectsTool,
//   startTimerTool,
//   stopTimerTool,
//   updateTimeEntryTool,
// } from "../tools/tracker";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";

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
  //   tools: {
  //     startTimer: startTimerTool,
  //     stopTimer: stopTimerTool,
  //     getTimeEntries: getTimeEntriesTool,
  //     createTimeEntry: createTimeEntryTool,
  //     updateTimeEntry: updateTimeEntryTool,
  //     deleteTimeEntry: deleteTimeEntryTool,
  //     getProjects: getTrackerProjectsTool,
  //   },
  maxTurns: 2,
});
