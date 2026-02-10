import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { baseUrl } from "@/app/sitemap";
import { IntegrationsGrid } from "@/components/integrations-grid";
import { categories, getAppsByCategory } from "@/data/apps";

interface Props {
  params: Promise<{ category: string }>;
}

// Get valid category IDs (excluding "all" since that's the main /integrations page)
const validCategories = categories
  .filter((c) => c.id !== "all")
  .map((c) => c.id);

export async function generateStaticParams() {
  return validCategories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const categoryData = categories.find((c) => c.id === category);

  if (!categoryData) {
    return {
      title: "Category Not Found",
    };
  }

  const title = `${categoryData.name} Integrations`;
  const description = `Connect Midday with ${categoryData.name.toLowerCase()} tools. Explore our ${categoryData.name.toLowerCase()} integrations to streamline your financial workflow.`;
  const url = `${baseUrl}/integrations/category/${category}`;

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
  const { category } = await params;

  // Validate category exists
  if (!validCategories.includes(category)) {
    notFound();
  }

  const apps = getAppsByCategory(category);

  return <IntegrationsGrid apps={apps} activeCategory={category} />;
}
