import type { AgentStatus } from "@/types/agents";
import type { ArtifactStage, ArtifactType } from "./artifact-config";
import {
  getArtifactSectionMessage,
  getArtifactStageMessage,
} from "./artifact-config";

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
    getRevenueSummary: "Analyzing your revenue trends...",
    getGrowthRate: "Calculating your growth rate...",
    profitLoss: "Computing your profit & loss statement...",
    getProfitAnalysis: "Computing your profit & loss statement...",
    cashFlow: "Analyzing your cash flow patterns...",
    getCashFlow: "Calculating your net cash flow...",
    balanceSheet: "Building your balance sheet...",
    getBalanceSheet: "Building your balance sheet...",
    expenses: "Categorizing your expenses...",
    getExpenses: "Categorizing your expenses...",
    burnRate: "Computing your monthly burn rate...",
    getBurnRate: "Computing your monthly burn rate...",
    runway: "Calculating your cash runway...",
    getRunway: "Calculating your cash runway...",
    spending: "Analyzing your spending trends...",
    getSpending: "Analyzing your spending patterns...",
    taxSummary: "Preparing your tax summary...",
    getTaxSummary: "Preparing your tax summary...",
    getForecast: "Generating your revenue forecast...",
    getMetricsBreakdown: "Preparing your financial breakdown...",

    // Analytics tools
    businessHealth: "Computing your business health score...",
    getBusinessHealthScore: "Computing your business health score...",
    getInsights: "Loading your insights...",
    cashFlowForecast: "Projecting your future cash flow...",
    stressTest: "Running financial stress scenarios...",
    getCashFlowStressTest: "Running financial stress scenarios...",

    // Customer tools
    getCustomers: "Retrieving your customers...",
    getCustomer: "Retrieving customer information...",
    createCustomer: "Setting up new customer profile...",
    updateCustomer: "Updating customer details...",
    profitabilityAnalysis: "Analyzing customer profitability...",

    // Invoice tools
    getInvoices: "Retrieving your invoices...",
    listInvoices: "Retrieving your invoices...",
    getInvoice: "Loading invoice details...",
    createInvoice: "Creating your invoice...",
    updateInvoice: "Updating invoice information...",
    getInvoicePaymentAnalysis: "Analyzing invoice payment patterns...",

    // Transaction tools
    getTransactions: "Retrieving your transactions...",
    listTransactions: "Retrieving your transactions...",
    getTransaction: "Loading transaction details...",

    // Time tracking tools
    getTimeEntries: "Retrieving your time entries...",
    createTimeEntry: "Recording your time...",
    updateTimeEntry: "Updating time entry...",
    deleteTimeEntry: "Removing time entry...",
    getProjects: "Loading your projects...",
    getTrackerProjects: "Loading your projects...",
    getTrackerEntries: "Retrieving your time entries...",
    createTrackerEntry: "Recording your time...",
    startTimer: "Starting your timer...",
    stopTimer: "Stopping your timer...",
    getTimerStatus: "Checking timer status...",

    // Operations tools
    getInbox: "Checking your inbox...",
    listInbox: "Checking your inbox...",
    getDocuments: "Loading your documents...",
    listDocuments: "Loading your documents...",
    getBalances: "Retrieving your account balances...",
    getAccountBalances: "Retrieving your account balances...",
    getBankAccounts: "Retrieving your bank accounts...",
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

// Generate user-friendly artifact stage messages (generic)
export const getArtifactStageMessageForStatus = (
  artifactType: ArtifactType | null,
  stage: ArtifactStage | null,
): string | null => {
  return getArtifactStageMessage(artifactType, stage);
};

// Generate section-specific status messages (generic)
export const getArtifactSectionMessageForStatus = (
  artifactType: ArtifactType | null,
  section: string | null,
): string | null => {
  return getArtifactSectionMessage(artifactType, section);
};
