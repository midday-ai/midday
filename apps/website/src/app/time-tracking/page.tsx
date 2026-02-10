import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { TimeTracking } from "@/components/time-tracking";

const title = "Time Tracking";
const description =
  "Track billable hours with ease. Get monthly breakdowns, link time to projects and customers, and generate invoices. Built for consultants and small business owners.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "time tracking",
    "billable hours",
    "time tracker",
    "project time tracking",
    "small business time management",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/time-tracking`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/time-tracking`,
  },
};

export default function Page() {
  return <TimeTracking />;
}
