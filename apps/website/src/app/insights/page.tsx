import { Insights } from "@/components/insights";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Business Insights",
  description:
    "Understand your business at a glance. Get weekly summaries, cash flow analysis, and clear explanations of revenue and spending trends.",
  path: "/insights",
  og: {
    title: "Insights",
    description: "Understand your business at a glance",
  },
  keywords: [
    "business insights",
    "business analytics",
    "cash flow analysis",
    "revenue tracking",
    "spending analysis",
  ],
});

export default function Page() {
  return <Insights />;
}
