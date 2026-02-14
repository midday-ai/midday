import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Inbox } from "@/components/inbox";

const title = "Receipt Inbox";
const description =
  "Capture receipts, invoices, and Peppol e-invoices automatically. Match documents to transactions, search your financial records, and stay organized. Built for small business owners.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "receipt management",
    "receipt scanner",
    "invoice management",
    "document management",
    "expense receipts",
    "e-invoicing",
    "peppol",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/inbox`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/inbox`,
  },
};

export default function Page() {
  return <Inbox />;
}
