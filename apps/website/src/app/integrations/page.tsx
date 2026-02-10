import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { IntegrationsGrid } from "@/components/integrations-grid";
import { apps } from "@/data/apps";

const title = "Integrations";
const description =
  "Connect Midday with your favorite tools. Explore integrations for email, accounting, productivity, and more.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/integrations`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/integrations`,
  },
};

export default function Page() {
  return <IntegrationsGrid apps={apps} activeCategory="all" />;
}
