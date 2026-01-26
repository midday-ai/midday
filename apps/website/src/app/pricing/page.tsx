import { Pricing } from "@/components/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for abacus. Start free and upgrade as you grow. The operating system for funding businesses.",
};

export default function Page() {
  return <Pricing />;
}
