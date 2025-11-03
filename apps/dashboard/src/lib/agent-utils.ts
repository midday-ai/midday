import type { AgentStatus } from "@/types/agents";

// Generate user-friendly status messages
export const getStatusMessage = (status?: AgentStatus | null) => {
  if (!status) {
    return null;
  }

  const { agent, status: state } = status;

  if (state === "routing") {
    return "Thinking...";
  }

  if (state === "executing") {
    const messages: Record<AgentStatus["agent"], string> = {
      triage: "Thinking...",
      orchestrator: "Coordinating your request...",
      general: "Getting information for you...",
      reports: "Generating your financial reports...",
      transactions: "Retrieving your transaction history...",
      invoices: "Checking your invoice status...",
      timeTracking: "Reviewing your time entries...",
      customers: "Looking up customer information...",
      analytics: "Running business intelligence analysis...",
      operations: "Accessing your account data...",
      research: "Researching and analyzing your options...",
    };

    return messages[agent];
  }

  return null;
};

// Generate user-friendly tool messages
export const getToolMessage = (toolName: string | null) => {
  if (!toolName) return null;

  const toolMessages: Record<string, string> = {
    // Reports tools
    revenue: "Calculating your revenue metrics...",
    profitLoss: "Computing your profit & loss statement...",
    cashFlow: "Analyzing your cash flow patterns...",
    balanceSheet: "Building your balance sheet...",
    expenses: "Categorizing your expenses...",
    burnRate: "Computing your monthly burn rate...",
    runway: "Calculating your cash runway...",
    spending: "Analyzing your spending trends...",
    taxSummary: "Preparing your tax summary...",

    // Analytics tools
    businessHealth: "Computing your business health score...",
    cashFlowForecast: "Projecting your future cash flow...",
    stressTest: "Running financial stress scenarios...",

    // Customer tools
    getCustomer: "Retrieving customer information...",
    createCustomer: "Setting up new customer profile...",
    updateCustomer: "Updating customer details...",
    profitabilityAnalysis: "Analyzing customer profitability...",

    // Invoice tools
    listInvoices: "Retrieving your invoices...",
    getInvoice: "Loading invoice details...",
    createInvoice: "Creating your invoice...",
    updateInvoice: "Updating invoice information...",

    // Transaction tools
    listTransactions: "Retrieving your transactions...",
    getTransaction: "Loading transaction details...",

    // Time tracking tools
    startTimer: "Starting your timer...",
    stopTimer: "Stopping your timer...",
    getTimeEntries: "Retrieving your time entries...",
    createTimeEntry: "Recording your time...",
    updateTimeEntry: "Updating time entry...",
    deleteTimeEntry: "Removing time entry...",
    getProjects: "Loading your projects...",

    // Operations tools
    listInbox: "Checking your inbox...",
    getBalances: "Retrieving your account balances...",
    listDocuments: "Loading your documents...",
    exportData: "Preparing your data export...",

    // Research tools
    webSearch: "Searching the web...",

    // Memory tools
    updateWorkingMemory: "Updating working memory...",

    // Handoff tools
    handoff_to_agent: "Connecting you with the right specialist...",
  };

  return toolMessages[toolName];
};
