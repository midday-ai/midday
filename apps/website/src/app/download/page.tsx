import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Download } from "@/components/download";

const title = "Download";
const description =
  "Download Midday for Mac. Your finances, always one click away. Access your business data directly from your desktop.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/download`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/download`,
  },
};

export default function Page() {
  return <Download />;
}
