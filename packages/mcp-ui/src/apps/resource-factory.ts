import { createUIResource, type UIResource as McpUIResource } from "@mcp-ui/server";
import { CHART_FRAME_SIZES } from "../utils/chart-config";
import { UI_RESOURCE_PREFIX } from "./registry";

// Export the UIResource type for consumers
export type UIResource = McpUIResource;

// Re-export the prefix for convenience
export { UI_RESOURCE_PREFIX };

/**
 * Chart resource configuration type
 */
export interface ChartResourceConfig {
  id: string;
  name: string;
  description: string;
  frameSize: keyof typeof CHART_FRAME_SIZES;
}

/**
 * Chart resource definitions
 */
export const CHART_RESOURCES: ChartResourceConfig[] = [
  {
    id: "spending-chart",
    name: "Spending Chart",
    description: "Donut chart showing spending breakdown by category",
    frameSize: "donut",
  },
  {
    id: "burn-rate-chart",
    name: "Burn Rate Chart",
    description: "Area chart showing monthly burn rate with trend line",
    frameSize: "area",
  },
  {
    id: "cash-flow-chart",
    name: "Cash Flow Chart",
    description: "Bar chart showing income vs expenses over time",
    frameSize: "stackedBar",
  },
  {
    id: "revenue-chart",
    name: "Revenue Chart",
    description: "Line chart showing revenue with period comparison",
    frameSize: "line",
  },
  {
    id: "profit-chart",
    name: "Profit Chart",
    description: "Bar chart showing profit with period comparison",
    frameSize: "bar",
  },
  {
    id: "runway-gauge",
    name: "Runway Gauge",
    description: "Gauge visualization showing months of runway remaining",
    frameSize: "gauge",
  },
  {
    id: "forecast-chart",
    name: "Forecast Chart",
    description: "Line chart showing historical revenue and future projections",
    frameSize: "line",
  },
  {
    id: "growth-rate-chart",
    name: "Growth Rate Chart",
    description: "Bar chart comparing growth between periods",
    frameSize: "bar",
  },
  {
    id: "profit-margin-chart",
    name: "Profit Margin Chart",
    description: "Line chart showing profit margin trends over time",
    frameSize: "line",
  },
  {
    id: "invoice-status-chart",
    name: "Invoice Status Chart",
    description: "Donut chart showing invoice breakdown by status",
    frameSize: "donut",
  },
];

/**
 * Create a UI resource from an HTML string
 */
export function createChartResource(
  chartId: string,
  htmlContent: string,
): UIResource {
  const config = CHART_RESOURCES.find((c) => c.id === chartId);
  if (!config) {
    throw new Error(`Unknown chart ID: ${chartId}`);
  }

  const frameSize = CHART_FRAME_SIZES[config.frameSize];

  return createUIResource({
    uri: `${UI_RESOURCE_PREFIX}/${chartId}` as `ui://${string}`,
    content: {
      type: "rawHtml",
      htmlString: htmlContent,
    },
    encoding: "text",
    uiMetadata: {
      "preferred-frame-size": [String(frameSize.width), String(frameSize.height)],
    },
  });
}

/**
 * Get the URI for a chart resource
 */
export function getChartResourceUri(chartId: string): string {
  return `${UI_RESOURCE_PREFIX}/${chartId}`;
}
