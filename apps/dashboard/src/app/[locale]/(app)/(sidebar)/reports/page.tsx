import type { Metadata } from "next";
import { getInitialMetricsSettings } from "@/utils/metrics-settings";
import { MetricsContent } from "./metrics-content";

export const metadata: Metadata = {
  title: "Reports | Midday",
};

export default function MetricsPage() {
  return <MetricsContent chartLayoutPromise={getInitialMetricsSettings()} />;
}
