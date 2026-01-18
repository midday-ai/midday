import { Insights } from "@/components/insights";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Understand what's happening in your business. Get weekly summaries and clear explanations of changes in cash, revenue, and spending.",
};

export default function Page() {
  return <Insights />;
}
