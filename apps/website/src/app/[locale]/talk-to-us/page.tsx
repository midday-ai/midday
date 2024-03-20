import { CalEmbed } from "@/components/cal-embed";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";

export const metadata: Metadata = {
  title: "Talk to us | Midday",
};

export default function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setStaticParamsLocale(locale);

  return (
    <div className="mt-24">
      <CalEmbed />
    </div>
  );
}
