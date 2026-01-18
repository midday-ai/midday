import { IntegrationDetailPage } from "@/components/integration-detail-page";
import { apps, getAllSlugs, getAppBySlug } from "@/data/apps";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

  return {
    title: `${app.name} Integration`,
    description: app.short_description,
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
