import { BrandCanvas } from "@/components/brand-canvas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branding",
};

export default function Page() {
  return <BrandCanvas />;
}
