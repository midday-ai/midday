import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Pricing } from "@/components/pricing";

const title = "Pricing";
const description =
  "Simple, transparent pricing for Midday. Start free and upgrade as you grow. Invoicing, expense tracking, and financial tools for small business owners.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "midday pricing",
    "free accounting software",
    "small business software pricing",
    "invoicing software cost",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/pricing`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/pricing`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Midday",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, macOS",
  description:
    "Business finance software for invoicing, expense tracking, time tracking, and financial insights.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "100",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Pricing />
    </>
  );
}
