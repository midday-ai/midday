import { baseUrl } from "@/app/sitemap";
import { Invoicing } from "@/components/invoicing";
import type { Metadata } from "next";

const title = "Invoicing";
const description =
  "Create professional invoices in seconds. Track payments, send reminders, and get paid faster. E-invoicing via Peppol for EU compliance in 46+ countries.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "invoice software",
    "small business invoicing",
    "online invoicing",
    "invoice generator",
    "billing software",
    "e-invoicing",
    "peppol",
    "electronic invoicing",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/invoicing`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/invoicing`,
  },
};

export default function Page() {
  return <Invoicing />;
}
