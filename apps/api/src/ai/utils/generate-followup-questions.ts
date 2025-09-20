import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { type ToolName, toolMetadata } from "../tools/registry";

const followupQuestionsSchema = z.object({
  questions: z
    .array(z.string())
    .max(4)
    .describe("Array of 2-4 contextual follow-up questions"),
});

/**
 * Generate follow-up questions based on tool output and available tools
 */
export async function generateFollowupQuestions(
  toolName: string,
  toolOutput: string,
): Promise<string[]> {
  try {
    // Get tool metadata if available
    const toolMeta = toolMetadata[toolName as ToolName];
    const relatedTools = toolMeta?.relatedTools || [];

    // Build context about available related tools
    const availableToolsContext =
      relatedTools.length > 0
        ? `\n\nAvailable related tools you can suggest questions for:
${relatedTools
  .map((tool) => {
    const meta = toolMetadata[tool as ToolName];
    return meta ? `- ${tool}: ${meta.description}` : `- ${tool}`;
  })
  .join("\n")}`
        : "";

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: followupQuestionsSchema,
      temperature: 0.7,
      system: `You are a financial assistant generating follow-up questions for Midday, a financial management platform.

Based on the tool output provided, generate 2-4 contextual follow-up questions that would be natural next steps. Each question should be:
- Short and actionable (max 8-10 words)
- Specific to the data and insights shown in the tool output
- Something that would provide deeper analysis or related insights
- Answerable with available tools in the system

Examples of good follow-up questions:
- "Compare vs last quarter"
- "Drill into expense categories" 
- "Show cost reduction opportunities"
- "Analyze seasonal patterns"
- "Break down by department"
- "Show growth trends"

Tool: ${toolName}
${toolMeta ? `Tool description: ${toolMeta.description}` : ""}${availableToolsContext}`,
      prompt: `Based on this tool output, generate relevant follow-up questions that would naturally extend the analysis:

Tool Output:
${toolOutput.slice(0, 2000)} ${toolOutput.length > 2000 ? "..." : ""}

Generate questions that would help the user dive deeper into this specific data or explore related financial insights.`,
    });

    return result.object.questions;
  } catch (error) {
    console.error("Failed to generate follow-up questions:", error);
    return [];
  }
}
