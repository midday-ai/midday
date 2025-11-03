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
  profitLoss: {
    name: "Profit & Loss",
    icon: BarChart3,
    description: "Calculating profit & loss",
  },
  cashFlow: {
    name: "Cash Flow",
    icon: DollarSign,
    description: "Analyzing cash flow",
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
  spending: {
    name: "Spending",
    icon: CreditCard,
    description: "Analyzing spending patterns",
  },
  taxSummary: {
    name: "Tax Summary",
    icon: FileText,
    description: "Generating tax summary",
  },

  // Analytics tools
  businessHealth: {
    name: "Business Health",
    icon: PieChart,
    description: "Analyzing business health",
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

  // Customer tools
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
  listInvoices: {
    name: "List Invoices",
    icon: FileText,
    description: "Fetching invoices",
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

  // Transaction tools
  listTransactions: {
    name: "List Transactions",
    icon: Receipt,
    description: "Fetching transactions",
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

  // Operations tools
  listInbox: {
    name: "List Inbox",
    icon: Inbox,
    description: "Fetching inbox items",
  },
  getBalances: {
    name: "Get Balances",
    icon: Wallet,
    description: "Fetching account balances",
  },
  listDocuments: {
    name: "List Documents",
    icon: FileArchive,
    description: "Fetching documents",
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
