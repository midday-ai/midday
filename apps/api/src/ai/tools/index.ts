import { createInvoiceTool } from "./create-invoice";
import { createTrackerEntryTool } from "./create-tracker-entry";
import { getAccountBalancesTool } from "./get-account-balances";
import { getBalanceSheetTool } from "./get-balance-sheet";
import { getBankAccountsTool } from "./get-bank-accounts";
import { getBurnRateTool } from "./get-burn-rate";
import { getBusinessHealthScoreTool } from "./get-business-health-score";
import { getCashFlowTool } from "./get-cash-flow";
import { getCashFlowStressTestTool } from "./get-cash-flow-stress-test";
import { getCustomersTool } from "./get-customers";
import { getDocumentsTool } from "./get-documents";
import { getExpensesTool } from "./get-expenses";
import { getForecastTool } from "./get-forecast";
import { getGrowthRateTool } from "./get-growth-rate";
import { getInboxTool } from "./get-inbox";
import { getInsightsTool } from "./get-insights";
import { getInvoicePaymentAnalysisTool } from "./get-invoice-payment-analysis";
import { getInvoicesTool } from "./get-invoices";
import { getMetricsBreakdownTool } from "./get-metrics-breakdown";
import { getNetPositionTool } from "./get-net-position";
import { getProfitAnalysisTool } from "./get-profit-analysis";
import { getRevenueSummaryTool } from "./get-revenue-summary";
import { getRunwayTool } from "./get-runway";
import { getSpendingTool } from "./get-spending";
import { getTaxSummaryTool } from "./get-tax-summary";
import { getTimerStatusTool } from "./get-timer-status";
import { getTrackerEntriesTool } from "./get-tracker-entries";
import { getTrackerProjectsTool } from "./get-tracker-projects";
import { getTransactionsTool } from "./get-transactions";
import { modifyInvoiceDraftTool } from "./modify-invoice-draft";
import { stopTimerTool } from "./stop-timer";
import { updateInvoiceTool } from "./update-invoice";
import { webSearchTool } from "./web-search";

export const allTools = {
  webSearch: webSearchTool,
  getInsights: getInsightsTool,
  getAccountBalances: getAccountBalancesTool,
  getNetPosition: getNetPositionTool,
  getBankAccounts: getBankAccountsTool,
  getTransactions: getTransactionsTool,
  getInvoices: getInvoicesTool,
  getCustomers: getCustomersTool,
  getDocuments: getDocumentsTool,
  getInbox: getInboxTool,
  getRunway: getRunwayTool,
  getCashFlow: getCashFlowTool,
  getCashFlowStressTest: getCashFlowStressTestTool,
  getProfitAnalysis: getProfitAnalysisTool,
  getRevenueSummary: getRevenueSummaryTool,
  getGrowthRate: getGrowthRateTool,
  getSpending: getSpendingTool,
  getBalanceSheet: getBalanceSheetTool,
  getExpenses: getExpensesTool,
  getTaxSummary: getTaxSummaryTool,
  getBurnRate: getBurnRateTool,
  getInvoicePaymentAnalysis: getInvoicePaymentAnalysisTool,
  getForecast: getForecastTool,
  getBusinessHealthScore: getBusinessHealthScoreTool,
  getMetricsBreakdown: getMetricsBreakdownTool,
  getTrackerProjects: getTrackerProjectsTool,
  getTrackerEntries: getTrackerEntriesTool,
  createTrackerEntry: createTrackerEntryTool,
  stopTimer: stopTimerTool,
  getTimerStatus: getTimerStatusTool,
  createInvoice: createInvoiceTool,
  updateInvoice: updateInvoiceTool,
  modifyInvoiceDraft: modifyInvoiceDraftTool,
};
