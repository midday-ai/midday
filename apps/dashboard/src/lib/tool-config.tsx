import {
  ArrowRight,
  BarChart3,
  Brain,
  Calculator,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Flame,
  FolderOpen,
  Inbox,
  PieChart,
  Play,
  Receipt,
  Search,
  Square,
  Timer,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { MdOutlineInsights } from "react-icons/md";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface ToolConfig {
  name: string;
  icon: IconComponent;
  description?: string;
}

export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  // Reports tools
  revenue: {
    name: "Revenue",
    icon: TrendingUp,
    description: "Analyzing revenue data",
  },
  getRevenueSummary: {
    name: "Revenue Summary",
    icon: TrendingUp,
    description: "Analyzing revenue trends",
  },
  getGrowthRate: {
    name: "Growth Rate",
    icon: TrendingUp,
    description: "Analyzing growth rate",
  },
  profitLoss: {
    name: "Profit & Loss",
    icon: BarChart3,
    description: "Calculating profit & loss",
  },
  getProfitAnalysis: {
    name: "Profit & Loss",
    icon: PieChart,
    description: "Analyzing profit & loss",
  },
  cashFlow: {
    name: "Cash Flow",
    icon: DollarSign,
    description: "Analyzing cash flow",
  },
  getCashFlow: {
    name: "Cash Flow",
    icon: DollarSign,
    description: "Calculating cash flow",
  },
  balanceSheet: {
    name: "Balance Sheet",
    icon: FileSpreadsheet,
    description: "Generating balance sheet",
  },
  expenses: {
    name: "Expenses",
    icon: Receipt,
    description: "Analyzing expenses",
  },
  burnRate: {
    name: "Burn Rate",
    icon: Flame,
    description: "Calculating burn rate",
  },
  runway: {
    name: "Runway",
    icon: Calendar,
    description: "Calculating runway",
  },
  getRunway: {
    name: "Runway",
    icon: Calendar,
    description: "Calculating cash runway",
  },
  spending: {
    name: "Spending",
    icon: CreditCard,
    description: "Analyzing spending patterns",
  },
  getSpending: {
    name: "Spending",
    icon: CreditCard,
    description: "Analyzing spending patterns",
  },
  taxSummary: {
    name: "Tax Summary",
    icon: FileText,
    description: "Generating tax summary",
  },
  getTaxSummary: {
    name: "Tax Summary",
    icon: FileText,
    description: "Generating tax summary",
  },
  getBalanceSheet: {
    name: "Balance Sheet",
    icon: FileSpreadsheet,
    description: "Generating balance sheet",
  },
  getExpenses: {
    name: "Expenses",
    icon: Receipt,
    description: "Analyzing expenses",
  },
  getBurnRate: {
    name: "Burn Rate",
    icon: Flame,
    description: "Calculating burn rate",
  },
  getForecast: {
    name: "Revenue Forecast",
    icon: TrendingUp,
    description: "Generating revenue forecast",
  },
  getMetricsBreakdown: {
    name: "Financial Breakdown",
    icon: BarChart3,
    description: "Preparing financial breakdown",
  },

  // Analytics tools
  businessHealth: {
    name: "Business Health",
    icon: PieChart,
    description: "Analyzing business health",
  },
  getBusinessHealthScore: {
    name: "Business Health Score",
    icon: PieChart,
    description: "Analyzing business health",
  },
  getInsights: {
    name: "Insights",
    icon: MdOutlineInsights,
    description: "Loading your insights",
  },
  cashFlowForecast: {
    name: "Cash Flow Forecast",
    icon: TrendingUp,
    description: "Forecasting cash flow",
  },
  stressTest: {
    name: "Stress Test",
    icon: Calculator,
    description: "Running stress test scenarios",
  },
  getCashFlowStressTest: {
    name: "Cash Flow Stress Test",
    icon: Calculator,
    description: "Running stress test scenarios",
  },

  // Customer tools
  getCustomers: {
    name: "Get Customers",
    icon: Users,
    description: "Fetching customers",
  },
  getCustomer: {
    name: "Get Customer",
    icon: User,
    description: "Fetching customer data",
  },
  createCustomer: {
    name: "Create Customer",
    icon: Users,
    description: "Creating new customer",
  },
  updateCustomer: {
    name: "Update Customer",
    icon: User,
    description: "Updating customer record",
  },
  profitabilityAnalysis: {
    name: "Profitability Analysis",
    icon: BarChart3,
    description: "Analyzing customer profitability",
  },

  // Invoice tools
  getInvoices: {
    name: "Get Invoices",
    icon: FileText,
    description: "Fetching invoices",
  },
  listInvoices: {
    name: "List Invoices",
    icon: FileText,
    description: "Fetching invoices (legacy)",
  },
  getInvoice: {
    name: "Get Invoice",
    icon: FileText,
    description: "Fetching invoice details",
  },
  createInvoice: {
    name: "Create Invoice",
    icon: FileText,
    description: "Creating invoice",
  },
  updateInvoice: {
    name: "Update Invoice",
    icon: FileText,
    description: "Updating invoice",
  },
  getInvoicePaymentAnalysis: {
    name: "Invoice Payment Analysis",
    icon: FileText,
    description: "Analyzing invoice payment patterns",
  },

  // Transaction tools
  getTransactions: {
    name: "Get Transactions",
    icon: Receipt,
    description: "Fetching transactions",
  },
  listTransactions: {
    name: "List Transactions",
    icon: Receipt,
    description: "Fetching transactions (legacy)",
  },
  getTransaction: {
    name: "Get Transaction",
    icon: Receipt,
    description: "Fetching transaction details",
  },

  // Time tracking tools
  startTimer: {
    name: "Start Timer",
    icon: Play,
    description: "Starting timer",
  },
  stopTimer: {
    name: "Stop Timer",
    icon: Square,
    description: "Stopping timer",
  },
  getTimeEntries: {
    name: "Get Time Entries",
    icon: Clock,
    description: "Fetching time entries",
  },
  createTimeEntry: {
    name: "Create Time Entry",
    icon: Timer,
    description: "Creating time entry",
  },
  updateTimeEntry: {
    name: "Update Time Entry",
    icon: Timer,
    description: "Updating time entry",
  },
  deleteTimeEntry: {
    name: "Delete Time Entry",
    icon: Timer,
    description: "Deleting time entry",
  },
  getProjects: {
    name: "Get Projects",
    icon: FolderOpen,
    description: "Fetching projects",
  },
  getTrackerProjects: {
    name: "Get Tracker Projects",
    icon: FolderOpen,
    description: "Fetching tracker projects",
  },
  getTrackerEntries: {
    name: "Get Tracker Entries",
    icon: Clock,
    description: "Fetching tracker entries",
  },
  createTrackerEntry: {
    name: "Create Tracker Entry",
    icon: Timer,
    description: "Recording your time",
  },
  getTimerStatus: {
    name: "Get Timer Status",
    icon: Clock,
    description: "Checking timer status",
  },

  // Operations tools
  getInbox: {
    name: "Get Inbox",
    icon: Inbox,
    description: "Fetching inbox items",
  },
  listInbox: {
    name: "List Inbox",
    icon: Inbox,
    description: "Fetching inbox items (legacy)",
  },
  getDocuments: {
    name: "Get Documents",
    icon: FileArchive,
    description: "Fetching documents",
  },
  listDocuments: {
    name: "List Documents",
    icon: FileArchive,
    description: "Fetching documents (legacy)",
  },
  getBalances: {
    name: "Get Balances",
    icon: Wallet,
    description: "Fetching account balances",
  },
  getAccountBalances: {
    name: "Account Balances",
    icon: Wallet,
    description: "Retrieving account balances",
  },
  getBankAccounts: {
    name: "Get Bank Accounts",
    icon: Wallet,
    description: "Fetching bank accounts",
  },
  exportData: {
    name: "Export Data",
    icon: Download,
    description: "Exporting data",
  },

  // Research tools
  webSearch: {
    name: "Web Search",
    icon: Search,
    description: "Searching the web",
  },

  // Memory tools
  updateWorkingMemory: {
    name: "Update Memory",
    icon: Brain,
    description: "Updating working memory",
  },

  // Handoff tools
  handoff_to_agent: {
    name: "Routing",
    icon: ArrowRight,
    description: "Routing to specialist",
  },
};

/**
 * Get tool configuration by tool name
 */
export function getToolConfig(toolName: string): ToolConfig | null {
  return TOOL_CONFIGS[toolName] || null;
}

/**
 * Get tool icon component by tool name
 */
export function getToolIcon(toolName: string): IconComponent | null {
  const config = getToolConfig(toolName);
  return config?.icon || null;
}

/**
 * Get tool display name by tool name
 */
export function getToolDisplayName(toolName: string): string | null {
  const config = getToolConfig(toolName);
  return config?.name || null;
}
