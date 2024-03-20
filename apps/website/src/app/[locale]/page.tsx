import { StartPage } from "@/components/startpage";
import { setStaticParamsLocale } from "next-international/server";

export default function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setStaticParamsLocale(locale);

  return <StartPage />;
}
