import type { UIMessage } from "ai";

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

export function extractInsightData(
  parts: UIMessage["parts"],
): InsightData | null {
  for (const part of parts) {
    const type = part.type as string;
    if (type === "tool-getInsights") {
      const toolPart = part as {
        output?: { success?: boolean; insight?: InsightData };
      };
      if (toolPart.output?.insight) {
        return toolPart.output.insight;
      }
    }
  }
  return null;
}

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
