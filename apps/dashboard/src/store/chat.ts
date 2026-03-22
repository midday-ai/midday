import { create } from "zustand";

const COMMAND_SUGGESTIONS = [
  {
    command: "/show",
    title: "Show latest transactions",
    keywords: ["show", "latest", "transactions", "recent"],
  },
  {
    command: "/show",
    title: "Show cash burn and top 3 vendor increases",
    keywords: ["show", "burn", "cash", "vendor", "increases", "analysis"],
  },
  {
    command: "/show",
    title: "Show where we're spending the most this month",
    keywords: ["show", "spending", "most", "this month", "where"],
  },
  {
    command: "/show",
    title: "Show weekly trends and insights",
    keywords: ["show", "weekly", "trends", "insights"],
  },
  {
    command: "/show",
    title: "Show revenue performance",
    keywords: ["show", "revenue", "performance", "analyze"],
  },
  {
    command: "/show",
    title: "Show expense breakdown by category",
    keywords: ["show", "expense", "breakdown", "category"],
  },
  {
    command: "/show",
    title: "Show profit margins",
    keywords: ["show", "profit", "margins"],
  },
  {
    command: "/show",
    title: "Show cash runway",
    keywords: ["show", "runway", "cash", "left"],
  },
  {
    command: "/show",
    title: "Show cash flow stress test",
    keywords: ["show", "stress", "test", "scenario", "resilience", "financial"],
  },
  {
    command: "/find",
    title: "Find untagged transactions from last month",
    keywords: ["find", "untagged", "transactions", "last month", "clean"],
  },
  {
    command: "/find",
    title: "Find recurring payments",
    keywords: ["find", "recurring", "payments", "subscriptions"],
  },
  {
    command: "/analyze",
    title: "Analyze burn rate trends",
    keywords: ["analyze", "burn", "rate", "trends"],
  },
  {
    command: "/analyze",
    title: "Analyze spending patterns",
    keywords: ["analyze", "spending", "patterns"],
  },
  {
    command: "/analyze",
    title: "Analyze financial resilience",
    keywords: [
      "analyze",
      "stress",
      "test",
      "resilience",
      "scenarios",
      "financial",
    ],
  },
  {
    command: "/show",
    title: "Show balance sheet",
    keywords: ["show", "balance", "sheet", "assets", "liabilities", "equity"],
  },
  {
    command: "/show",
    title: "Show growth rate analysis",
    keywords: ["show", "growth", "rate", "revenue", "profit", "trends"],
  },
  {
    command: "/analyze",
    title: "Analyze revenue growth trends",
    keywords: ["analyze", "revenue", "growth", "trends", "period"],
  },
  {
    command: "/show",
    title: "Show invoice payment analysis",
    keywords: ["show", "invoice", "payment", "analysis", "days", "overdue"],
  },
  {
    command: "/analyze",
    title: "Analyze customer payment patterns",
    keywords: ["analyze", "customer", "payment", "patterns", "invoices"],
  },
  {
    command: "/show",
    title: "Show tax summary",
    keywords: ["show", "tax", "summary", "deductions", "year"],
  },
  {
    command: "/show",
    title: "Show tax breakdown by category",
    keywords: ["show", "tax", "breakdown", "category", "deductions"],
  },
  {
    command: "/show",
    title: "Show business health score",
    keywords: ["show", "business", "health", "score", "metrics"],
  },
  {
    command: "/analyze",
    title: "Analyze business health metrics",
    keywords: ["analyze", "business", "health", "metrics", "performance"],
  },
  {
    command: "/show",
    title: "Show revenue forecast",
    keywords: ["show", "revenue", "forecast", "projection", "future"],
  },
  {
    command: "/analyze",
    title: "Analyze revenue projections",
    keywords: ["analyze", "revenue", "projections", "forecast", "trends"],
  },
  {
    command: "/show",
    title: "Show expenses breakdown",
    keywords: ["show", "expenses", "breakdown", "category", "analysis"],
  },
  {
    command: "/analyze",
    title: "Analyze expense categories",
    keywords: ["analyze", "expense", "categories", "breakdown"],
  },
  {
    command: "/show",
    title: "Show revenue summary",
    keywords: ["show", "revenue", "summary", "income", "earnings"],
  },
  {
    command: "/show",
    title: "Show revenue trends this year",
    keywords: ["show", "revenue", "trends", "year", "this year"],
  },
  {
    command: "/show",
    title: "Show profit and loss statement",
    keywords: ["show", "profit", "loss", "statement", "p&l"],
  },
  {
    command: "/analyze",
    title: "Analyze profit margins",
    keywords: ["analyze", "profit", "margins", "profitability"],
  },
  {
    command: "/show",
    title: "Show account balances",
    keywords: ["show", "account", "balances", "bank", "accounts"],
  },
  {
    command: "/show",
    title: "Show latest invoices",
    keywords: ["show", "latest", "invoices", "recent"],
  },
  {
    command: "/find",
    title: "Find unpaid invoices",
    keywords: ["find", "unpaid", "invoices", "outstanding"],
  },
  {
    command: "/find",
    title: "Find overdue invoices",
    keywords: ["find", "overdue", "invoices", "late"],
  },
  {
    command: "/show",
    title: "Show customers",
    keywords: ["show", "customers", "clients", "list"],
  },
  {
    command: "/find",
    title: "Find top customers",
    keywords: ["find", "top", "customers", "clients"],
  },
  {
    command: "/show",
    title: "Show cash flow",
    keywords: ["show", "cash", "flow", "income", "expenses"],
  },
  {
    command: "/show",
    title: "Show cash flow this month",
    keywords: ["show", "cash", "flow", "month", "this month"],
  },
  {
    command: "/analyze",
    title: "Analyze cash flow trends",
    keywords: ["analyze", "cash", "flow", "trends", "patterns"],
  },
  {
    command: "/show",
    title: "Show expenses",
    keywords: ["show", "expenses", "costs", "spending"],
  },
  {
    command: "/show",
    title: "Show expenses this month",
    keywords: ["show", "expenses", "month", "this month"],
  },
  {
    command: "/analyze",
    title: "Analyze expense trends",
    keywords: ["analyze", "expense", "trends", "patterns"],
  },
];

export interface CommandSuggestion {
  command: string;
  title: string;
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
    const { selectedCommandIndex } = get();
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
