export const ENTITY_LINK_RE = /^#(txn|inv|cust|project|inbox|doc):/;

export const ICON_SIZE = 13;

export const STATUS_ROW = "flex items-center gap-1.5 h-5 text-xs";

export const INVOICE_TOOLS = new Set([
  "invoices_get",
  "invoices_create",
  "invoices_update_draft",
  "invoices_create_from_tracker",
]);

export const HIDDEN_TOOLS = new Set(["toolSearch"]);

export const TOOL_LABELS: Record<string, string> = {
  transactions_list: "Looking up transactions",
  transactions_get: "Fetching transaction details",
  transactions_create: "Creating transaction",
  transactions_update: "Updating transaction",
  invoices_list: "Looking up invoices",
  invoices_get: "Fetching invoice",
  invoices_create: "Creating invoice",
  invoices_update_draft: "Updating invoice",
  invoices_create_from_tracker: "Creating invoice from time entries",
  bank_accounts_list: "Checking bank accounts",
  bank_accounts_get: "Fetching account details",
  reports_profit_loss: "Generating profit & loss report",
  reports_revenue: "Calculating revenue",
  reports_burn_rate: "Calculating burn rate",
  reports_expense: "Analyzing expenses",
  tracker_entries_list: "Looking up time entries",
  tracker_projects_list: "Looking up projects",
  inbox_list: "Checking inbox",
  categories_list: "Fetching categories",
  search_global: "Searching",
  web_search: "Searching the web",
  COMPOSIO_SEARCH_TOOLS: "Looking up your connections",
  COMPOSIO_GET_TOOL_SCHEMAS: "Preparing action",
  COMPOSIO_MANAGE_CONNECTIONS: "Checking connection",
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
  return (
    TOOL_LABELS[name] ??
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
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
