import { MetricsView } from "@/components/metrics/metrics-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metrics | Midday",
};

export default function MetricsPage() {
  return <MetricsView />;
}
