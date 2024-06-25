import { BrandCanvas } from "@/components/brand-canvas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branding",
  description: "Download branding assets, logo, screenshots and more.",
};

export default function Page() {
  return <BrandCanvas />;
}
