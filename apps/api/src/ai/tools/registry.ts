// Tool metadata for title generation and UI display
export const toolMetadata = {
  getBurnRate: {
    name: "getBurnRate",
    description:
      "Get burn rate analysis with runway projections and optimization recommendations",
    relatedTools: ["getExpenses", "getSpending", "getRunway", "getCashFlow"],
  },
  // getRevenue: {
  //   name: "getRevenue",
  //   description: "Analyze revenue trends, growth patterns, and revenue sources",
  //   relatedTools: ["getProfit", "getCashFlow", "getBurnRate"],
  // },
  // getExpenses: {
  //   name: "getExpenses",
  //   description:
  //     "Analyze spending patterns, expense categories, and cost optimization",
  //   relatedTools: ["getBurnRate", "getSpending", "getCategoryExpenses"],
  // },
  // getProfit: {
  //   name: "getProfit",
  //   description:
  //     "Calculate profit margins, profitability analysis, and P&L insights",
  //   relatedTools: ["getRevenue", "getExpenses", "getCashFlow"],
  // },
  // getCashFlow: {
  //   name: "getCashFlow",
  //   description: "Analyze cash flow patterns, working capital, and liquidity",
  //   relatedTools: ["getBurnRate", "getRunway", "getRevenue"],
  // },
  // getRunway: {
  //   name: "getRunway",
  //   description: "Calculate cash runway and funding requirements",
  //   relatedTools: ["getBurnRate", "getCashFlow", "getExpenses"],
  // },
  // getTimeTrack: {
  //   name: "getTimeTrack",
  //   description:
  //     "Analyze time tracking data, productivity metrics, and project insights",
  //   relatedTools: ["getProjects", "getTeamMetrics"],
  // },
  // healthReport: {
  //   name: "healthReport",
  //   description:
  //     "Generate comprehensive business health report and KPI dashboard",
  //   relatedTools: ["getBurnRate", "getRevenue", "getCashFlow", "getProfit"],
  // },
  // newTask: {
  //   name: "newTask",
  //   description: "Create and manage business tasks and action items",
  //   relatedTools: ["getTimeTrack", "getProjects"],
  // },
} as const;

export type ToolName = keyof typeof toolMetadata;

export type MessageDataParts = {
  title: {
    title: string;
  };
};
