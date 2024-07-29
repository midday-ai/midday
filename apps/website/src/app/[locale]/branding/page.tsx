import { BrandCanvas } from "@/components/brand-canvas";
import { getStaticParams } from "@/locales/server";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";

export const metadata: Metadata = {
  title: "Branding",
  description: "Download branding assets, logo, screenshots and more.",
};

export function generateStaticParams() {
  return getStaticParams();
}

export default function Page({
  params: { locale },
}: { params: { locale: string } }) {
  setStaticParamsLocale(locale);

  return <BrandCanvas />;
}
