import { PitchCarusel } from "@/components/pitch/pitch-carousel";
import { Grid } from "@/components/pitch/ui";
import { getStaticParams } from "@/locales/server";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";

export const metadata: Metadata = {
  title: "Pitch",
  description: "Pitch deck",
};

export function generateStaticParams() {
  return getStaticParams();
}

export default function Page({
  params: { locale },
}: { params: { locale: string } }) {
  setStaticParamsLocale(locale);

  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 h-screen">
      <Grid />

      <PitchCarusel />
    </div>
  );
}
