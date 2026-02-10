import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Transactions } from "@/components/transactions";

const title = "Transactions";
const description =
  "Track all your business expenses in one place. Automatically sync and categorize transactions from your bank accounts. Built for small business owners.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "expense tracking",
    "business expenses",
    "transaction management",
    "expense categorization",
    "small business accounting",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/transactions`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/transactions`,
  },
};

export default function Page() {
  return <Transactions />;
}
