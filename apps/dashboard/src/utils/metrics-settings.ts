import { cookies } from "next/headers";
import {
  type ChartId,
  type ChartLayoutItem,
  type ColSpan,
  DEFAULT_CHART_LAYOUT,
  DEFAULT_CHART_ORDER,
  VALID_COL_SPANS,
} from "@/components/metrics/utils/chart-types";

export const METRICS_SETTINGS_COOKIE = "metrics-settings";

export interface MetricsSettings {
  layout?: ChartLayoutItem[];
  chartOrder?: ChartId[];
}

function isValidColSpan(value: unknown): value is ColSpan {
  return VALID_COL_SPANS.includes(value as ColSpan);
}

/**
 * Convert a legacy ChartId[] order into ChartLayoutItem[] using default spans.
 */
function chartOrderToLayout(order: ChartId[]): ChartLayoutItem[] {
  const defaultSpans = new Map(
    DEFAULT_CHART_LAYOUT.map((item) => [item.id, item.colSpan]),
  );
  return order.map((id) => ({
    id,
    colSpan: defaultSpans.get(id) ?? 6,
  }));
}

/**
 * Parse a raw cookie value into a validated layout.
 * Supports both new `{ layout }` and legacy `{ chartOrder }` formats.
 * Unknown IDs are dropped; missing charts are appended with default spans.
 */
export function parseMetricsLayout(raw: string | undefined): ChartLayoutItem[] {
  if (!raw) return DEFAULT_CHART_LAYOUT;

  try {
    const parsed: MetricsSettings = JSON.parse(raw);

    // New format: { layout: ChartLayoutItem[] }
    if (Array.isArray(parsed.layout)) {
      return validateLayout(parsed.layout);
    }

    // Legacy format: { chartOrder: ChartId[] }
    if (Array.isArray(parsed.chartOrder)) {
      const validIds = new Set<ChartId>(DEFAULT_CHART_ORDER);
      const seen = new Set<ChartId>();
      const order: ChartId[] = [];

      for (const id of parsed.chartOrder) {
        if (validIds.has(id as ChartId) && !seen.has(id as ChartId)) {
          order.push(id as ChartId);
          seen.add(id as ChartId);
        }
      }

      for (const id of DEFAULT_CHART_ORDER) {
        if (!seen.has(id)) order.push(id);
      }

      return chartOrderToLayout(order);
    }

    return DEFAULT_CHART_LAYOUT;
  } catch {
    return DEFAULT_CHART_LAYOUT;
  }
}

function validateLayout(items: unknown[]): ChartLayoutItem[] {
  const validIds = new Set<ChartId>(DEFAULT_CHART_ORDER);
  const seen = new Set<ChartId>();
  const layout: ChartLayoutItem[] = [];

  for (const item of items) {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "colSpan" in item
    ) {
      const { id, colSpan } = item as { id: string; colSpan: unknown };
      if (
        validIds.has(id as ChartId) &&
        !seen.has(id as ChartId) &&
        isValidColSpan(colSpan)
      ) {
        layout.push({ id: id as ChartId, colSpan });
        seen.add(id as ChartId);
      }
    }
  }

  // Append any missing widgets at the end with default spans
  const defaultSpans = new Map(
    DEFAULT_CHART_LAYOUT.map((item) => [item.id, item.colSpan]),
  );
  for (const id of DEFAULT_CHART_ORDER) {
    if (!seen.has(id)) {
      layout.push({ id, colSpan: defaultSpans.get(id) ?? 6 });
    }
  }

  return layout;
}

/**
 * Server-side reader: get chart layout from the metrics-settings cookie.
 */
export async function getInitialMetricsSettings(): Promise<ChartLayoutItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(METRICS_SETTINGS_COOKIE)?.value;
  return parseMetricsLayout(raw);
}
