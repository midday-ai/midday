/**
 * Base URI prefix for Midday MCP UI resources
 */
export const UI_RESOURCE_PREFIX = "ui://midday" as const;

/**
 * UI Resource URIs for MCP tools
 * Maps MCP tool names to their corresponding UI resource URIs
 */
export const UI_RESOURCE_URIS = {
  // Reports
  spending: `${UI_RESOURCE_PREFIX}/spending-chart`,
  burnRate: `${UI_RESOURCE_PREFIX}/burn-rate-chart`,
  cashFlow: `${UI_RESOURCE_PREFIX}/cash-flow-chart`,
  revenue: `${UI_RESOURCE_PREFIX}/revenue-chart`,
  profit: `${UI_RESOURCE_PREFIX}/profit-chart`,
  runway: `${UI_RESOURCE_PREFIX}/runway-gauge`,
  forecast: `${UI_RESOURCE_PREFIX}/forecast-chart`,
  growthRate: `${UI_RESOURCE_PREFIX}/growth-rate-chart`,
  profitMargin: `${UI_RESOURCE_PREFIX}/profit-margin-chart`,
  
  // Invoices
  invoiceSummary: `${UI_RESOURCE_PREFIX}/invoice-status-chart`,
} as const;

/**
 * Type for UI resource URI keys
 */
export type UIResourceKey = keyof typeof UI_RESOURCE_URIS;

/**
 * Get a UI resource URI by key
 */
export function getResourceUri(key: UIResourceKey): string {
  return UI_RESOURCE_URIS[key];
}

/**
 * Tool to resource URI mapping for automatic resource attachment
 * Maps MCP tool names to their UI resource URIs
 */
export const TOOL_RESOURCE_MAP: Record<string, string> = {
  // Report tools
  reports_spending: UI_RESOURCE_URIS.spending,
  reports_burn_rate: UI_RESOURCE_URIS.burnRate,
  reports_cash_flow: UI_RESOURCE_URIS.cashFlow,
  reports_revenue: UI_RESOURCE_URIS.revenue,
  reports_profit: UI_RESOURCE_URIS.profit,
  reports_runway: UI_RESOURCE_URIS.runway,
  reports_revenue_forecast: UI_RESOURCE_URIS.forecast,
  reports_growth_rate: UI_RESOURCE_URIS.growthRate,
  reports_profit_margin: UI_RESOURCE_URIS.profitMargin,
  
  // Invoice tools
  invoices_summary: UI_RESOURCE_URIS.invoiceSummary,
} as const;

/**
 * Get the resource URI for a tool name
 * Returns undefined if no UI resource is available for the tool
 */
export function getToolResourceUri(toolName: string): string | undefined {
  return TOOL_RESOURCE_MAP[toolName];
}
