import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Customers } from "@/components/customers";

const title = "Customer Management";
const description =
  "Know your customers better. Track customer performance, payment history, and outstanding invoices all in one place.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/customers`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/customers`,
  },
};

export default function Page() {
  return <Customers />;
}
