import type { UIMessage } from "ai";
import type { ArtifactType } from "./artifact-config";
import { getArtifactTypeFromTool } from "./artifact-config";

/**
 * Insight data from getInsights tool
 */
export type InsightData = {
  id: string;
  periodLabel: string;
  periodType: string;
  title?: string;
  content?: {
    summary?: string;
    story?: string;
    actions?: Array<{
      text: string;
      type?: string;
      entityType?: "invoice" | "project" | "customer" | "transaction";
      entityId?: string;
    }>;
  } | null;
  selectedMetrics?: Array<{
    type: string;
    label: string;
    value: number;
    previousValue?: number;
    change: number;
    changeDirection: "up" | "down" | "flat";
    currency?: string;
  }>;
  activity?: {
    invoicesOverdue?: number;
    overdueAmount?: number;
  };
  expenseAnomalies?: Array<{
    type: string;
    categoryName: string;
    currentAmount: number;
    change: number;
    currency: string;
  }>;
  predictions?: {
    invoicesDue?: {
      count: number;
      totalAmount: number;
      currency: string;
    };
    streakAtRisk?: {
      type: string;
      count: number;
    };
  };
  isFirstInsight?: boolean;
  currency: string;
};

/**
 * Extract insight data from getInsights tool result
 */
export function extractInsightData(
  parts: UIMessage["parts"],
): InsightData | null {
  for (const part of parts) {
    const type = part.type as string;
    if (type === "tool-getInsights") {
      const toolPart = part as {
        output?: { success?: boolean; insight?: InsightData };
      };
      // The insight data is included in the yielded output
      if (toolPart.output?.insight) {
        return toolPart.output.insight;
      }
    }
  }
  return null;
}

/**
 * Check if getInsights tool is present (running or completed)
 * Used to hide loading indicators as soon as the tool starts
 */
export function hasInsightToolRunning(parts: UIMessage["parts"]): boolean {
  for (const part of parts) {
    const type = part.type as string;
    if (type === "tool-getInsights") {
      return true;
    }
  }
  return false;
}

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
