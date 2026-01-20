import { Pricing } from "@/components/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for Midday. Start free and upgrade as you grow. One plan for all your business finance needs.",
};

export default function Page() {
  return <Pricing />;
}
