import type { Metadata } from "next";
import { BrandCanvas } from "@/components/brand-canvas";

export const metadata: Metadata = {
  title: "Branding",
};

export default function Page() {
  return <BrandCanvas />;
}
