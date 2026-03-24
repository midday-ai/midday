import { cookies } from "next/headers";
import {
  type ChartId,
  DEFAULT_CHART_ORDER,
} from "@/components/metrics/utils/chart-types";

export const METRICS_SETTINGS_COOKIE = "metrics-settings";

export interface MetricsSettings {
  chartOrder: ChartId[];
}

/**
 * Parse a raw cookie value into a validated chart order.
 * Unknown IDs are dropped; missing default charts are appended.
 */
export function parseMetricsChartOrder(raw: string | undefined): ChartId[] {
  if (!raw) return DEFAULT_CHART_ORDER;

  try {
    const parsed: MetricsSettings = JSON.parse(raw);
    if (!Array.isArray(parsed.chartOrder)) return DEFAULT_CHART_ORDER;

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
      if (!seen.has(id)) {
        order.push(id);
      }
    }

    return order;
  } catch {
    return DEFAULT_CHART_ORDER;
  }
}

/**
 * Server-side reader: get chart order from the metrics-settings cookie.
 */
export async function getInitialMetricsSettings(): Promise<ChartId[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(METRICS_SETTINGS_COOKIE)?.value;
  return parseMetricsChartOrder(raw);
}
