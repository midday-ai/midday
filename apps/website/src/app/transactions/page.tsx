import { Transactions } from "@/components/transactions";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Business Transaction Tracking & Bank Sync",
  description:
    "Track all your business expenses in one place. Automatically sync and categorize transactions from your bank accounts. Built for small business owners.",
  path: "/transactions",
  og: {
    title: "Transactions",
    description: "Every expense, automatically synced and sorted",
  },
  keywords: [
    "expense tracking",
    "business expenses",
    "transaction management",
    "expense categorization",
    "small business accounting",
  ],
});

export default function Page() {
  return <Transactions />;
}
