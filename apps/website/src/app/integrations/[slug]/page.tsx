import { notFound } from "next/navigation";
import { IntegrationDetailPage } from "@/components/integration-detail-page";
import { getAllSlugs, getAppBySlug } from "@/data/apps";
import { createPageMetadata } from "@/lib/metadata";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    return { title: "Integration Not Found" };
  }

  return createPageMetadata({
    title: `${app.name} Integration`,
    description: app.short_description,
    path: `/integrations/${slug}`,
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  return <IntegrationDetailPage app={app} />;
}
