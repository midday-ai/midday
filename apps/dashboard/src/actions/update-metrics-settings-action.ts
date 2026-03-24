"use server";

import { addYears } from "date-fns";
import { cookies } from "next/headers";
import type { ChartId } from "@/components/metrics/utils/chart-types";
import { METRICS_SETTINGS_COOKIE } from "@/utils/metrics-settings";

export async function updateMetricsSettingsAction(chartOrder: ChartId[]) {
  (await cookies()).set(
    METRICS_SETTINGS_COOKIE,
    JSON.stringify({ chartOrder }),
    { expires: addYears(new Date(), 10) },
  );
}
