// Tool metadata for title generation and UI display
export const toolMetadata = {
  getBurnRateAnalysis: {
    name: "getBurnRateAnalysis",
    title: "Burn Rate Analysis",
    description:
      "Generate comprehensive burn rate analysis with interactive visualizations, spending trends, runway projections, and actionable insights",
    relatedTools: ["getBurnRate", "getTransactions", "getExpenses"],
  },
  getBurnRate: {
    name: "getBurnRate",
    title: "Burn Rate",
    description:
      "Calculate and analyze monthly cash burn rate, showing how much money the business spends each month",
    relatedTools: ["getBurnRateAnalysis", "getTransactions"],
  },
  getTransactions: {
    name: "getTransactions",
    title: "Transactions",
    description:
      "Retrieve and analyze financial transactions with advanced filtering, search, and sorting capabilities",
    relatedTools: ["getBurnRate", "getBurnRateAnalysis", "getExpenses"],
  },
  getExpensesBreakdown: {
    name: "getExpensesBreakdown",
    title: "Expenses Breakdown",
    description:
      "Retrieve and analyze financial expenses with advanced filtering, search, and sorting capabilities",
    relatedTools: ["getBurnRate", "getBurnRateAnalysis", "getTransactions"],
  },
  getBalanceSheet: {
    name: "getBalanceSheet",
    title: "Balance Sheet",
    description:
      "Retrieve and analyze financial balance sheet with advanced filtering, search, and sorting capabilities",
    relatedTools: ["getBurnRate", "getBurnRateAnalysis", "getTransactions"],
  },
  getForecast: {
    name: "getForecast",
    title: "Forecast",
    description:
      "Retrieve and analyze financial forecast with advanced filtering, search, and sorting capabilities",
    relatedTools: ["getBurnRate", "getBurnRateAnalysis", "getTransactions"],
  },
} as const;

export type ToolName = keyof typeof toolMetadata;

export type MessageDataParts = {
  title: {
    title: string;
  };
};
