import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";

export const metadata: Metadata = {
  title: "Support | Midday",
};

export default function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setStaticParamsLocale(locale);

  return null;
}
