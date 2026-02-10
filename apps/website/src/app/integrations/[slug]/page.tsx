import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { baseUrl } from "@/app/sitemap";
import { IntegrationDetailPage } from "@/components/integration-detail-page";
import { getAllSlugs, getAppBySlug } from "@/data/apps";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    return {
      title: "Integration Not Found",
    };
  }

  const title = `${app.name} Integration`;
  const description = app.short_description;
  const url = `${baseUrl}/integrations/${slug}`;

  return {
    title,
    description,
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
  const app = getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  return <IntegrationDetailPage app={app} />;
}
