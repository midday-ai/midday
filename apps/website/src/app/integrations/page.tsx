import { IntegrationsPage } from "@/components/integrations-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Connect abacus with your favorite tools. Explore integrations for email, accounting, productivity, and more.",
};

export default function Page() {
  return <IntegrationsPage />;
}
