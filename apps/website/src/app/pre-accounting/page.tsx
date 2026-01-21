import { baseUrl } from "@/app/sitemap";
import { PreAccounting } from "@/components/pre-accounting";
import type { Metadata } from "next";

const title = "Bookkeeping for Small Business";
const description =
  "Automated bookkeeping that collects transactions, matches receipts, and prepares accountant-ready records. Save hours on manual data entry every month.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "bookkeeping software",
    "small business bookkeeping",
    "automated bookkeeping",
    "pre-accounting",
    "accountant-ready records",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/pre-accounting`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/pre-accounting`,
  },
};

export default function Page() {
  return <PreAccounting />;
}
