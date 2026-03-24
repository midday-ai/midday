import type { Metadata } from "next";
import { OverviewView } from "@/components/widgets";
import { getInitialMetricsSettings } from "@/utils/metrics-settings";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default function Overview() {
  return <OverviewView chartOrderPromise={getInitialMetricsSettings()} />;
}
