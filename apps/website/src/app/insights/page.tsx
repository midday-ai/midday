import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Insights } from "@/components/insights";

const title = "Business Insights";
const description =
  "Understand your business at a glance. Get weekly summaries, cash flow analysis, and clear explanations of revenue and spending trends.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "business insights",
    "business analytics",
    "cash flow analysis",
    "revenue tracking",
    "spending analysis",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/insights`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/insights`,
  },
};

export default function Page() {
  return <Insights />;
}
