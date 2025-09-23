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
    toolName: "getBurnRateAnalysis",
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
    toolName: "getBurnRateAnalysis",
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
    toolName: "getRevenue",
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
    toolName: "getProfit",
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
    toolName: "getBurnRateAnalysis",
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
  webSearch: boolean;
  setWebSearch: (webSearch: boolean) => void;

  // Upload state
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;

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
  webSearch: false,
  isUploading: false,
  showCommands: false,
  selectedCommandIndex: 0,
  commandQuery: "",
  cursorPosition: 0,
  filteredCommands: COMMAND_SUGGESTIONS,

  // Basic setters
  setInput: (input) => set({ input }),
  clearInput: () => set({ input: "", cursorPosition: 0 }),
  setWebSearch: (webSearch) => set({ webSearch }),
  setIsUploading: (isUploading) => set({ isUploading }),
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
