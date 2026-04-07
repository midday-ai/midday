import { IntegrationsGrid } from "@/components/integrations-grid";
import { apps } from "@/data/apps";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Integrations",
  description:
    "Connect Midday with your favorite tools. Explore integrations for email, accounting, productivity, and more.",
  path: "/integrations",
  og: {
    title: "Integrations",
    description: "Connect Midday with your favorite tools",
  },
});

export default function Page() {
  return <IntegrationsGrid apps={apps} activeCategory="all" />;
}
