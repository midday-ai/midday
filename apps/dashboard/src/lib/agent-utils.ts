export const getToolMessage = (toolName: string | null) => {
  if (!toolName) return null;

  const toolMessages: Record<string, string> = {
    getRevenueSummary: "Analyzing your revenue trends...",
    getGrowthRate: "Calculating your growth rate...",
    getProfitAnalysis: "Computing your profit & loss statement...",
    getCashFlow: "Calculating your net cash flow...",
    getBalanceSheet: "Building your balance sheet...",
    getExpenses: "Categorizing your expenses...",
    getBurnRate: "Computing your monthly burn rate...",
    getRunway: "Calculating your cash runway...",
    getSpending: "Analyzing your spending patterns...",
    getTaxSummary: "Preparing your tax summary...",
    getForecast: "Generating your revenue forecast...",
    getMetricsBreakdown: "Preparing your financial breakdown...",
    getBusinessHealthScore: "Computing your business health score...",
    getInsights: "Loading your insights...",
    getCashFlowStressTest: "Running financial stress scenarios...",
    getCustomers: "Retrieving your customers...",
    getInvoices: "Retrieving your invoices...",
    createInvoice: "Opening invoice creation...",
    getInvoicePaymentAnalysis: "Analyzing invoice payment patterns...",
    getTransactions: "Retrieving your transactions...",
    getTrackerProjects: "Loading your projects...",
    getTrackerEntries: "Retrieving your time entries...",
    createTrackerEntry: "Recording your time...",
    stopTimer: "Stopping your timer...",
    getTimerStatus: "Checking timer status...",
    getInbox: "Checking your inbox...",
    getDocuments: "Loading your documents...",
    getAccountBalances: "Retrieving your account balances...",
    getBankAccounts: "Retrieving your bank accounts...",
    getNetPosition: "Calculating net position...",
    webSearch: "Searching the web...",
  };

  return toolMessages[toolName] ?? null;
};
