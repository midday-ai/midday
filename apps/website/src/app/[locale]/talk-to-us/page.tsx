import { CalEmbed } from "@/components/cal-embed";
import { getStaticParams } from "@/locales/server";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";

export const metadata: Metadata = {
  title: "Talk to us",
  description: "Schedule a meeting with us",
};

export function generateStaticParams() {
  return getStaticParams();
}

export default function Page({
  params: { locale },
}: { params: { locale: string } }) {
  setStaticParamsLocale(locale);

  return (
    <div className="mt-24">
      <CalEmbed calLink="pontus-midday/15min" />
    </div>
  );
}
