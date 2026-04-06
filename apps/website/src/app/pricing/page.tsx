import { Pricing } from "@/components/pricing";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Simple, transparent pricing for Midday. Start free and upgrade as you grow. Invoicing, expense tracking, and financial tools for small business owners.",
  path: "/pricing",
  og: { title: "Pricing", description: "Start free, upgrade as you grow" },
  keywords: [
    "midday pricing",
    "free accounting software",
    "small business software pricing",
    "invoicing software cost",
  ],
});

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
