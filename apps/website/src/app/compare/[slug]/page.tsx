import { baseUrl } from "@/app/sitemap";
import { ComparisonPage } from "@/components/comparison-page";
import { getAllCompetitorSlugs, getCompetitorBySlug } from "@/data/competitors";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCompetitorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);

  if (!competitor) {
    return {
      title: "Comparison Not Found",
    };
  }

  const title = `${competitor.name} Alternative: ${competitor.tagline} | Midday`;
  const description = competitor.description;
  const url = `${baseUrl}/compare/${slug}`;

  return {
    title,
    description,
    keywords: [
      `${competitor.name.toLowerCase()} alternative`,
      `${competitor.name.toLowerCase()} vs midday`,
      "business finance software",
      "invoicing software",
      "expense tracking",
      "time tracking software",
      "founder tools",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);

  if (!competitor) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${competitor.name} Alternative: ${competitor.tagline}`,
    description: competitor.description,
    url: `${baseUrl}/compare/${slug}`,
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "Midday",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, macOS",
      description:
        "Business finance software for invoicing, expense tracking, time tracking, and financial insights.",
      offers: {
        "@type": "Offer",
        price: "29",
        priceCurrency: "USD",
        description: "Starting at $29/month",
      },
    },
    about: {
      "@type": "SoftwareApplication",
      name: competitor.name,
      applicationCategory: "BusinessApplication",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ComparisonPage competitor={competitor} />
    </>
  );
}
