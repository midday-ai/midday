import { type ToolName, toolMetadata } from "@api/ai/tools/registry";

/**
 * Formats a tool call into a descriptive title for chat sessions
 * @param toolName - The name of the tool from the registry
 * @param toolParams - The parameters passed to the tool
 * @returns A formatted string suitable for generating chat titles
 */
export function formatToolCallTitle(
  toolName: string,
  toolParams: Record<string, any>,
): string {
  // Get the tool info from registry
  const toolInfo = toolMetadata[toolName as ToolName];

  // Use the description from the tool registry
  const baseDescription = toolInfo.description;

  // Format parameters for display (filter out null/undefined values)
  const relevantParams = Object.entries(toolParams)
    .filter(([key, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${value}`);

  // Combine tool name, description and parameters
  if (relevantParams.length > 0) {
    return `${toolName} - ${baseDescription} (${relevantParams.join(", ")})`;
  }

  return `${toolName} - ${baseDescription}`;
}
