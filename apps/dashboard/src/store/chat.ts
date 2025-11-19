import {
  endOfMonth,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { create } from "zustand";

// Command system with / prefix - natural language suggestions
const COMMAND_SUGGESTIONS = [
  {
    command: "/show",
    title: "Show latest transactions",
    toolName: "getTransactions",
    toolParams: { pageSize: 10, sort: ["date", "desc"] },
    keywords: ["show", "latest", "transactions", "recent"],
  },
  {
    command: "/show",
    title: "Show cash burn and top 3 vendor increases",
    toolName: "getBurnRate",
    toolParams: { showCanvas: true },
    keywords: ["show", "burn", "cash", "vendor", "increases", "analysis"],
  },
  {
    command: "/show",
    title: "Show where we're spending the most this month",
    toolName: "getSpending",
    toolParams: {
      from: startOfMonth(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
      showCanvas: true,
    },
    keywords: ["show", "spending", "most", "this month", "where"],
  },
  {
    command: "/show",
    title: "Show weekly trends and insights",
    toolName: "getBurnRate",
    toolParams: {
      from: subDays(new Date(), 7).toISOString(),
      to: new Date().toISOString(),
      showCanvas: true,
    },
    keywords: ["show", "weekly", "trends", "insights"],
  },
  {
    command: "/show",
    title: "Show revenue performance",
    toolName: "getRevenueSummary",
    toolParams: {
      from: startOfYear(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
      showCanvas: true,
    },
    keywords: ["show", "revenue", "performance", "analyze"],
  },
  {
    command: "/show",
    title: "Show expense breakdown by category",
    toolName: "getSpending",
    toolParams: { showCanvas: true },
    keywords: ["show", "expense", "breakdown", "category"],
  },
  {
    command: "/show",
    title: "Show profit margins",
    toolName: "getProfitAnalysis",
    toolParams: { showCanvas: true },
    keywords: ["show", "profit", "margins"],
  },
  {
    command: "/show",
    title: "Show cash runway",
    toolName: "getRunway",
    toolParams: { showCanvas: true },
    keywords: ["show", "runway", "cash", "left"],
  },
  {
    command: "/show",
    title: "Show cash flow stress test",
    toolName: "getCashFlowStressTest",
    toolParams: { showCanvas: true },
    keywords: ["show", "stress", "test", "scenario", "resilience", "financial"],
  },
  {
    command: "/find",
    title: "Find untagged transactions from last month",
    toolName: "getTransactions",
    toolParams: {
      from: subMonths(new Date(), 1).toISOString(),
      to: new Date().toISOString(),
      statuses: ["pending"],
    },
    keywords: ["find", "untagged", "transactions", "last month", "clean"],
  },
  {
    command: "/find",
    title: "Find recurring payments",
    toolName: "getTransactions",
    toolParams: { recurring: true },
    keywords: ["find", "recurring", "payments", "subscriptions"],
  },
  {
    command: "/analyze",
    title: "Analyze burn rate trends",
    toolName: "getBurnRate",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "burn", "rate", "trends"],
  },
  {
    command: "/analyze",
    title: "Analyze spending patterns",
    toolName: "getSpending",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "spending", "patterns"],
  },
  {
    command: "/analyze",
    title: "Analyze financial resilience",
    toolName: "getCashFlowStressTest",
    toolParams: { showCanvas: true },
    keywords: [
      "analyze",
      "stress",
      "test",
      "resilience",
      "scenarios",
      "financial",
    ],
  },
  // Balance Sheet
  {
    command: "/show",
    title: "Show balance sheet",
    toolName: "getBalanceSheet",
    toolParams: { showCanvas: true },
    keywords: ["show", "balance", "sheet", "assets", "liabilities", "equity"],
  },
  // Growth Rate
  {
    command: "/show",
    title: "Show growth rate analysis",
    toolName: "getGrowthRate",
    toolParams: { showCanvas: true },
    keywords: ["show", "growth", "rate", "revenue", "profit", "trends"],
  },
  {
    command: "/analyze",
    title: "Analyze revenue growth trends",
    toolName: "getGrowthRate",
    toolParams: { showCanvas: true, type: "revenue" },
    keywords: ["analyze", "revenue", "growth", "trends", "period"],
  },
  // Invoice Payment Analysis
  {
    command: "/show",
    title: "Show invoice payment analysis",
    toolName: "getInvoicePaymentAnalysis",
    toolParams: { showCanvas: true },
    keywords: ["show", "invoice", "payment", "analysis", "days", "overdue"],
  },
  {
    command: "/analyze",
    title: "Analyze customer payment patterns",
    toolName: "getInvoicePaymentAnalysis",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "customer", "payment", "patterns", "invoices"],
  },
  // Tax Summary
  {
    command: "/show",
    title: "Show tax summary",
    toolName: "getTaxSummary",
    toolParams: { showCanvas: true },
    keywords: ["show", "tax", "summary", "deductions", "year"],
  },
  {
    command: "/show",
    title: "Show tax breakdown by category",
    toolName: "getTaxSummary",
    toolParams: { showCanvas: true },
    keywords: ["show", "tax", "breakdown", "category", "deductions"],
  },
  // Business Health Score
  {
    command: "/show",
    title: "Show business health score",
    toolName: "getBusinessHealthScore",
    toolParams: { showCanvas: true },
    keywords: ["show", "business", "health", "score", "metrics"],
  },
  {
    command: "/analyze",
    title: "Analyze business health metrics",
    toolName: "getBusinessHealthScore",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "business", "health", "metrics", "performance"],
  },
  // Forecast
  {
    command: "/show",
    title: "Show revenue forecast",
    toolName: "getForecast",
    toolParams: { showCanvas: true },
    keywords: ["show", "revenue", "forecast", "projection", "future"],
  },
  {
    command: "/analyze",
    title: "Analyze revenue projections",
    toolName: "getForecast",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "revenue", "projections", "forecast", "trends"],
  },
  // Expenses Breakdown
  {
    command: "/show",
    title: "Show expenses breakdown",
    toolName: "getExpensesBreakdown",
    toolParams: { showCanvas: true },
    keywords: ["show", "expenses", "breakdown", "category", "analysis"],
  },
  {
    command: "/analyze",
    title: "Analyze expense categories",
    toolName: "getExpensesBreakdown",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "expense", "categories", "breakdown"],
  },
  // Revenue Summary
  {
    command: "/show",
    title: "Show revenue summary",
    toolName: "getRevenueSummary",
    toolParams: { showCanvas: true },
    keywords: ["show", "revenue", "summary", "income", "earnings"],
  },
  {
    command: "/show",
    title: "Show revenue trends this year",
    toolName: "getRevenueSummary",
    toolParams: {
      from: startOfYear(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
      showCanvas: true,
    },
    keywords: ["show", "revenue", "trends", "year", "this year"],
  },
  // Profit Analysis
  {
    command: "/show",
    title: "Show profit and loss statement",
    toolName: "getProfitAnalysis",
    toolParams: { showCanvas: true },
    keywords: ["show", "profit", "loss", "statement", "p&l"],
  },
  {
    command: "/analyze",
    title: "Analyze profit margins",
    toolName: "getProfitAnalysis",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "profit", "margins", "profitability"],
  },
  // Account Balances
  {
    command: "/show",
    title: "Show account balances",
    toolName: "getAccountBalances",
    toolParams: {},
    keywords: ["show", "account", "balances", "bank", "accounts"],
  },
  // Invoices
  {
    command: "/show",
    title: "Show latest invoices",
    toolName: "getInvoices",
    toolParams: { pageSize: 10, sort: ["createdAt", "desc"] },
    keywords: ["show", "latest", "invoices", "recent"],
  },
  {
    command: "/find",
    title: "Find unpaid invoices",
    toolName: "getInvoices",
    toolParams: { statuses: ["unpaid"], pageSize: 20 },
    keywords: ["find", "unpaid", "invoices", "outstanding"],
  },
  {
    command: "/find",
    title: "Find overdue invoices",
    toolName: "getInvoices",
    toolParams: { statuses: ["overdue"], pageSize: 20 },
    keywords: ["find", "overdue", "invoices", "late"],
  },
  // Customers
  {
    command: "/show",
    title: "Show customers",
    toolName: "getCustomers",
    toolParams: { pageSize: 10 },
    keywords: ["show", "customers", "clients", "list"],
  },
  {
    command: "/find",
    title: "Find top customers",
    toolName: "getCustomers",
    toolParams: { pageSize: 10 },
    keywords: ["find", "top", "customers", "clients"],
  },
  // Cash Flow
  {
    command: "/show",
    title: "Show cash flow",
    toolName: "getCashFlow",
    toolParams: { showCanvas: true },
    keywords: ["show", "cash", "flow", "income", "expenses"],
  },
  {
    command: "/show",
    title: "Show cash flow this month",
    toolName: "getCashFlow",
    toolParams: {
      from: startOfMonth(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
      showCanvas: true,
    },
    keywords: ["show", "cash", "flow", "month", "this month"],
  },
  {
    command: "/analyze",
    title: "Analyze cash flow trends",
    toolName: "getCashFlow",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "cash", "flow", "trends", "patterns"],
  },
  // Expenses
  {
    command: "/show",
    title: "Show expenses",
    toolName: "getExpenses",
    toolParams: { showCanvas: true },
    keywords: ["show", "expenses", "costs", "spending"],
  },
  {
    command: "/show",
    title: "Show expenses this month",
    toolName: "getExpenses",
    toolParams: {
      from: startOfMonth(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
      showCanvas: true,
    },
    keywords: ["show", "expenses", "month", "this month"],
  },
  {
    command: "/analyze",
    title: "Analyze expense trends",
    toolName: "getExpenses",
    toolParams: { showCanvas: true },
    keywords: ["analyze", "expense", "trends", "patterns"],
  },
];

export interface CommandSuggestion {
  command: string;
  title: string;
  toolName: string;
  toolParams: Record<string, any>;
  keywords: string[];
}

interface ChatState {
  // Input state
  input: string;
  setInput: (input: string) => void;
  clearInput: () => void;

  // Web search state
  isWebSearch: boolean;
  setIsWebSearch: (isWebSearch: boolean) => void;

  // Upload state
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;

  // Recording state
  isRecording: boolean;
  isProcessing: boolean;
  setIsRecording: (isRecording: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;

  // Command suggestions state
  showCommands: boolean;
  setShowCommands: (showCommands: boolean) => void;
  selectedCommandIndex: number;
  setSelectedCommandIndex: (index: number) => void;
  commandQuery: string;
  setCommandQuery: (query: string) => void;
  cursorPosition: number;
  setCursorPosition: (position: number) => void;

  // Filtered commands (computed)
  filteredCommands: CommandSuggestion[];

  // Actions
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleCommandSelect: (command: CommandSuggestion) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  resetCommandState: () => void;
  navigateCommandUp: () => void;
  navigateCommandDown: () => void;
  selectCurrentCommand: () => CommandSuggestion | null;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  // Initial state
  input: "",
  isWebSearch: false,
  isUploading: false,
  isRecording: false,
  isProcessing: false,
  showCommands: false,
  selectedCommandIndex: 0,
  commandQuery: "",
  cursorPosition: 0,
  filteredCommands: COMMAND_SUGGESTIONS,

  // Basic setters
  setInput: (input) => set({ input }),
  clearInput: () => set({ input: "", cursorPosition: 0 }),
  setIsWebSearch: (isWebSearch) => set({ isWebSearch }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setShowCommands: (showCommands) => set({ showCommands }),
  setSelectedCommandIndex: (selectedCommandIndex) =>
    set({ selectedCommandIndex }),
  setCommandQuery: (commandQuery) => set({ commandQuery }),
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),

  // Input change handler
  handleInputChange: (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    set({ input: value, cursorPosition: cursorPos });

    // Check if we're typing a command
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
      const textAfterSlash = textBeforeCursor.substring(lastSlashIndex + 1);

      // Filter commands based on the query
      const query = textAfterSlash.toLowerCase().trim();
      const filtered = COMMAND_SUGGESTIONS.filter((command) => {
        const matchesCommand = command.command.toLowerCase().includes(query);
        const matchesTitle = command.title.toLowerCase().includes(query);
        const matchesKeywords = command.keywords.some((keyword) =>
          keyword.toLowerCase().includes(query),
        );
        return matchesCommand || matchesTitle || matchesKeywords;
      });

      // Always show commands when typing after a slash, regardless of spaces
      set({
        commandQuery: textAfterSlash,
        showCommands: true,
        selectedCommandIndex: 0,
        filteredCommands: filtered,
      });
      return;
    }

    set({
      showCommands: false,
      commandQuery: "",
      filteredCommands: COMMAND_SUGGESTIONS,
    });
  },

  // Command selection handler
  handleCommandSelect: (command) => {
    const { input, cursorPosition } = get();
    const textBeforeCursor = input.substring(0, cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf("/");
    const textAfterCursor = input.substring(cursorPosition);

    // Replace the command with the full suggestion
    const newText = `${textBeforeCursor.substring(0, lastSlashIndex)}${command.title} ${textAfterCursor}`;

    set({
      input: newText,
      showCommands: false,
      commandQuery: "",
    });
  },

  // Keyboard navigation handler
  handleKeyDown: (e) => {
    const { showCommands, filteredCommands, selectedCommandIndex } = get();

    if (!showCommands) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        set({
          selectedCommandIndex: Math.min(
            selectedCommandIndex + 1,
            filteredCommands.length - 1,
          ),
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        set({
          selectedCommandIndex: Math.max(selectedCommandIndex - 1, 0),
        });
        break;
      case "Enter": {
        e.preventDefault();
        const currentCommand = get().selectCurrentCommand();
        if (currentCommand) {
          get().handleCommandSelect(currentCommand);
        }
        break;
      }
      case "Escape":
        set({ showCommands: false, commandQuery: "" });
        break;
    }
  },

  // Utility functions
  resetCommandState: () => {
    set({
      showCommands: false,
      commandQuery: "",
      selectedCommandIndex: 0,
    });
  },

  navigateCommandUp: () => {
    const { selectedCommandIndex, filteredCommands } = get();
    set({
      selectedCommandIndex: Math.max(selectedCommandIndex - 1, 0),
    });
  },

  navigateCommandDown: () => {
    const { selectedCommandIndex, filteredCommands } = get();
    set({
      selectedCommandIndex: Math.min(
        selectedCommandIndex + 1,
        filteredCommands.length - 1,
      ),
    });
  },

  selectCurrentCommand: () => {
    const { filteredCommands, selectedCommandIndex } = get();
    return filteredCommands[selectedCommandIndex] || null;
  },
}));
