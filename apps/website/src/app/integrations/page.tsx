import type { Metadata } from "next";
import { IntegrationsPage } from "@/components/integrations-page";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Connect Midday with your favorite tools. Explore integrations for email, accounting, productivity, and more.",
};

export default function Page() {
  return <IntegrationsPage />;
}
