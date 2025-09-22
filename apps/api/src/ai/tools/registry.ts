// Tool metadata for title generation and UI display
export const toolMetadata = {
  getBurnRateAnalysis: {
    name: "getBurnRateAnalysis",
    description:
      "Get burn rate analysis with runway projections and optimization recommendations",
    relatedTools: ["getExpenses", "getSpending", "getRunway", "getCashFlow"],
  },
  getBurnRate: {
    name: "getBurnRate",
    description: "Get current burn rate data and basic financial metrics",
    relatedTools: ["getBurnRateAnalysis"],
  },
} as const;

export type ToolName = keyof typeof toolMetadata;

export type MessageDataParts = {
  title: {
    title: string;
  };
};
