import { type ToolName, toolMetadata } from "@api/ai/tools/registry";

/**
 * Formats a tool call into a descriptive title for chat sessions
 * @param toolName - The name of the tool from the registry
 * @returns A formatted string suitable for generating chat titles
 */
export function formatToolCallTitle(toolName: string): string {
  // Get the tool info from registry
  const toolInfo = toolMetadata[toolName as ToolName];

  // Use the description from the tool registry
  const baseDescription = toolInfo.description;

  return `${toolInfo.title} - ${baseDescription}`;
}
