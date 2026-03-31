import type { UIMessage } from "ai";

export const ENTITY_LINK_RE =
  /^#(txn|inv|cust|project|inbox|doc|connect|navigate):/;

export const ICON_SIZE = 13;

export const STATUS_ROW = "flex items-center gap-1.5 h-5 text-xs";

export const INVOICE_TOOLS = new Set([
  "invoices_get",
  "invoices_create",
  "invoices_update_draft",
  "invoices_create_from_tracker",
]);

export const HIDDEN_TOOLS = new Set(["search_tools"]);

export const TOOL_LABELS: Record<string, string> = {
  // Transactions
  transactions_list: "Looking up transactions",
  transactions_get: "Fetching transaction",
  transactions_create: "Creating transaction",
  transactions_update: "Updating transaction",
  transactions_delete: "Deleting transaction",
  transactions_bulk_delete: "Deleting transactions",
  transactions_export: "Exporting transactions",
  transactions_sync: "Syncing transactions",
  transactions_search: "Searching transactions",

  // Invoices
  invoices_list: "Looking up invoices",
  invoices_get: "Fetching invoice",
  invoices_create: "Creating invoice",
  invoices_update_draft: "Updating invoice",
  invoices_duplicate: "Duplicating invoice",
  invoices_send: "Sending invoice",
  invoices_remind: "Sending reminder",
  invoices_mark_paid: "Marking invoice as paid",
  invoices_cancel: "Cancelling invoice",
  invoices_delete: "Deleting invoice",
  invoices_search_number: "Finding invoice",
  invoices_payment_status: "Checking payment status",
  invoices_analytics: "Fetching invoice analytics",
  invoices_create_from_tracker: "Creating invoice from time entries",

  // Invoice products
  invoice_products_list: "Fetching products",
  invoice_products_create: "Creating product",
  invoice_products_update: "Updating product",
  invoice_products_delete: "Deleting product",

  // Invoice templates
  invoice_template_list: "Fetching templates",
  invoice_template_update: "Updating template",

  // Recurring invoices
  invoice_recurring_list: "Fetching recurring invoices",
  invoice_recurring_create: "Creating recurring invoice",
  invoice_recurring_pause: "Pausing recurring invoice",
  invoice_recurring_resume: "Resuming recurring invoice",
  invoice_recurring_delete: "Deleting recurring invoice",
  invoice_recurring_upcoming: "Checking upcoming invoices",

  // Customers
  customers_list: "Looking up customers",
  customers_get: "Fetching customer",
  customers_create: "Creating customer",
  customers_update: "Updating customer",
  customers_delete: "Deleting customer",
  customers_search: "Searching customers",

  // Bank accounts
  bank_accounts_list: "Checking bank accounts",
  bank_accounts_get: "Fetching account details",
  bank_accounts_balances: "Checking balances",

  // Reports
  reports_revenue: "Calculating revenue",
  reports_profit: "Calculating profit",
  reports_burn_rate: "Calculating burn rate",
  reports_runway: "Calculating runway",
  reports_expenses: "Analyzing expenses",
  reports_spending: "Analyzing spending",
  reports_tax_summary: "Generating tax summary",
  reports_growth_rate: "Calculating growth rate",
  reports_profit_margin: "Calculating profit margin",
  reports_cash_flow: "Analyzing cash flow",
  reports_recurring_expenses: "Analyzing recurring expenses",
  reports_revenue_forecast: "Forecasting revenue",
  reports_balance_sheet: "Generating balance sheet",
  reports_profit_loss: "Generating profit & loss report",
  reports_expense: "Analyzing expenses",

  // Time tracking
  tracker_projects_list: "Looking up projects",
  tracker_projects_create: "Creating project",
  tracker_projects_update: "Updating project",
  tracker_projects_delete: "Deleting project",
  tracker_entries_list: "Looking up time entries",
  tracker_entries_create: "Logging time",
  tracker_entries_update: "Updating time entry",
  tracker_entries_delete: "Deleting time entry",
  tracker_timer_start: "Starting timer",
  tracker_timer_stop: "Stopping timer",
  tracker_timer_status: "Checking timer",

  // Categories
  categories_list: "Fetching categories",
  categories_create: "Creating category",
  categories_update: "Updating category",
  categories_delete: "Deleting category",

  // Tags
  tags_list: "Fetching tags",
  tags_create: "Creating tag",
  tags_update: "Updating tag",
  tags_delete: "Deleting tag",

  // Inbox
  inbox_list: "Checking inbox",
  inbox_get: "Fetching receipt",
  inbox_match: "Matching receipt",
  inbox_unmatch: "Unmatching receipt",

  // Documents
  documents_list: "Fetching documents",
  documents_get: "Fetching document",
  documents_delete: "Deleting document",
  documents_tag: "Tagging document",

  // Search & Team
  search_global: "Searching",
  team_members: "Fetching team members",
  team_info: "Fetching team info",

  // Web search
  web_search: "Searching the web",

  // Connected apps
  COMPOSIO_SEARCH_TOOLS: "Looking up connected apps",
  COMPOSIO_GET_TOOL_SCHEMAS: "Preparing action",
  COMPOSIO_MANAGE_CONNECTIONS: "Checking app connection",
  COMPOSIO_MULTI_EXECUTE_TOOL: "Running action",
  COMPOSIO_REMOTE_WORKBENCH: "Background agent working",
  COMPOSIO_REMOTE_BASH_TOOL: "Background agent working",
};

export type DynamicToolPart = {
  type: "dynamic-tool";
  toolName: string;
  state: string;
  toolCallId: string;
  output?: unknown;
};

export type NormalizedToolPart = {
  toolName: string;
  state: string;
  toolCallId: string;
  output?: unknown;
};

export function isToolPart(part: { type: string }): part is {
  type: string;
  toolName?: string;
  state: string;
  toolCallId: string;
  output?: unknown;
} {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export function normalizeToolPart(
  part: Record<string, unknown>,
): NormalizedToolPart {
  if (part.type === "dynamic-tool") {
    return {
      toolName: part.toolName as string,
      state: part.state as string,
      toolCallId: part.toolCallId as string,
      output: part.output,
    };
  }
  const type = part.type as string;
  return {
    toolName: type.replace(/^tool-/, ""),
    state: part.state as string,
    toolCallId: part.toolCallId as string,
    output: part.output,
  };
}

export type SourceUrlPart = {
  type: "source-url";
  sourceId: string;
  url: string;
  title?: string;
};

export function formatToolName(name: string): string {
  if (TOOL_LABELS[name]) return TOOL_LABELS[name];

  const parts = name.split("_");
  if (parts.length < 2) return name;

  const action = parts[parts.length - 1]!;
  const noun = parts.slice(0, -1).join(" ");

  const GERUNDS: Record<string, string> = {
    list: "Looking up",
    get: "Fetching",
    create: "Creating",
    update: "Updating",
    delete: "Deleting",
    search: "Searching",
    export: "Exporting",
    send: "Sending",
    start: "Starting",
    stop: "Stopping",
    match: "Matching",
    sync: "Syncing",
    pause: "Pausing",
    resume: "Resuming",
    cancel: "Cancelling",
    duplicate: "Duplicating",
    remind: "Sending reminder for",
  };

  const verb = GERUNDS[action];
  if (verb) return `${verb} ${noun}`;

  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractInvoiceData(
  output: unknown,
): Record<string, unknown> | null {
  if (!output || typeof output !== "object") return null;
  const result = output as Record<string, unknown>;
  const structured = result.structuredContent as
    | Record<string, unknown>
    | undefined;
  return (structured?.invoice ?? structured?.data ?? null) as Record<
    string,
    unknown
  > | null;
}

export function getRootDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function addUtmSource(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("utm_source");
    u.searchParams.set("utm_source", "midday.ai");
    return u.toString();
  } catch {
    return url;
  }
}

export type ParsedAssistantMessage = {
  toolParts: NormalizedToolPart[];
  visibleTools: NormalizedToolPart[];
  textContent: string;
  sourceParts: SourceUrlPart[];
  showThinking: boolean;
  hasContent: boolean;
  isLastMessage: boolean;
};

export function parseAssistantMessage(
  message: UIMessage,
  opts: { isStreaming: boolean; isLastMessage: boolean },
): ParsedAssistantMessage {
  const { isLastMessage } = opts;

  const toolParts: NormalizedToolPart[] = message.parts
    .filter((p) => isToolPart(p as { type: string }))
    .map((p) => normalizeToolPart(p as Record<string, unknown>));

  const hasTools = toolParts.length > 0;
  const lastToolIndex = hasTools
    ? Math.max(
        ...message.parts.map((p, i) =>
          isToolPart(p as { type: string }) ? i : -1,
        ),
      )
    : -1;

  const toolsInProgress =
    hasTools &&
    toolParts.some(
      (p) => p.state !== "output-available" && p.state !== "output-error",
    );

  const rawText =
    isLastMessage && toolsInProgress
      ? ""
      : message.parts
          .filter(
            (p, i): p is { type: "text"; text: string } =>
              p.type === "text" && (!hasTools || i > lastToolIndex),
          )
          .map((p) => p.text)
          .join("");

  const textContent = rawText.trim() ? rawText : "";

  const visibleTools = toolParts.filter((p) => !HIDDEN_TOOLS.has(p.toolName));

  const sourceParts = message.parts.filter(
    (p) => p.type === "source-url",
  ) as SourceUrlPart[];

  const showThinking =
    isLastMessage && !textContent && visibleTools.length === 0;

  const hasContent =
    !!textContent || visibleTools.length > 0 || sourceParts.length > 0;

  return {
    toolParts,
    visibleTools,
    textContent,
    sourceParts,
    showThinking,
    hasContent,
    isLastMessage,
  };
}
