import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { FileStorage } from "@/components/file-storage";

const title = "Document Vault";
const description =
  "Store and organize all your business documents in one secure place. Access receipts, contracts, invoices, and files anytime. Built for small business owners.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "document storage",
    "business file storage",
    "secure document vault",
    "receipt storage",
    "contract management",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/file-storage`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/file-storage`,
  },
};

export default function Page() {
  return <FileStorage />;
}
