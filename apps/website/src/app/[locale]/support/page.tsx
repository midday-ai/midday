import { SupportForm } from "@/components/support-form";
import { getStaticParams } from "@/locales/server";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Midday",
};

export function generateStaticParams() {
  return getStaticParams();
}

export default function Page({
  params: { locale },
}: { params: { locale: string } }) {
  setStaticParamsLocale(locale);

  return (
    <div className="max-w-[750px] m-auto">
      <h1 className="mt-24 font-medium text-center text-5xl mb-16 leading-snug">
        Support
      </h1>

      <SupportForm />
    </div>
  );
}
