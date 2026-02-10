import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { BankCoverage } from "@/components/bank-coverage";

const title = "Bank Coverage";
const description =
  "We currently support over 25,000+ banks worldwide. Search to find your bank and connect your accounts to Midday.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/bank-coverage`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/bank-coverage`,
  },
};

export default function CoveragePage() {
  return <BankCoverage />;
}
