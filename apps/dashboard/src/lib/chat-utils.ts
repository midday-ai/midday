import type { UIMessage } from "ai";
import type { ArtifactType } from "./artifact-config";
import { getArtifactTypeFromTool } from "./artifact-config";

/**
 * Check if message parts indicate bank account is required
 */
export function extractBankAccountRequired(parts: UIMessage["parts"]): boolean {
  for (const part of parts) {
    if ((part.type as string).startsWith("tool-")) {
      const toolPart = part as Record<string, unknown>;
      const errorText = toolPart.errorText as string | undefined;

      if (errorText === "BANK_ACCOUNT_REQUIRED") {
        return true;
      }
    }
  }
  return false;
}

/**
 * Extract artifact type from message parts
 * Checks all tool calls in the message and returns the first artifact type found
 */
export function extractArtifactTypeFromMessage(
  parts: UIMessage["parts"],
): ArtifactType | null {
  for (const part of parts) {
    const type = part.type as string;
    if (type.startsWith("tool-")) {
      const toolPart = part as Record<string, unknown>;

      // Extract tool name from type (e.g., "tool-cashFlow" -> "cashFlow")
      const toolName =
        type === "dynamic-tool"
          ? (toolPart.toolName as string)
          : type.replace(/^tool-/, "");

      const artifactType = getArtifactTypeFromTool(toolName);
      if (artifactType) {
        return artifactType;
      }
    }
  }
  return null;
}
