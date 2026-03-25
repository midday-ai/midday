"use server";

import { addYears } from "date-fns";
import { cookies } from "next/headers";
import type { ChartLayoutItem } from "@/components/metrics/utils/chart-types";
import { METRICS_SETTINGS_COOKIE } from "@/utils/metrics-settings";

export async function updateMetricsSettingsAction(layout: ChartLayoutItem[]) {
  (await cookies()).set(METRICS_SETTINGS_COOKIE, JSON.stringify({ layout }), {
    expires: addYears(new Date(), 10),
  });
}
