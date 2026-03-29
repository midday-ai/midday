import type { Metadata } from "next";
import { OverviewView } from "@/components/widgets";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default function Overview() {
  return <OverviewView />;
}
