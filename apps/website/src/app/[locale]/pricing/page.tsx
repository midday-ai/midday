import { CTAButtons } from "@/components/cta-buttons";
import { getStaticParams } from "@/locales/server";
import { setStaticParamsLocale } from "next-international/server";

export function generateStaticParams() {
  return getStaticParams();
}

export default function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setStaticParamsLocale(locale);

  return (
    <div className="text-center">
      <h1 className="mt-24 font-medium text-center text-5xl mb-8">
        What it cost.
      </h1>

      <div className="flex items-center flex-col">
        <h3 className="text-[344px] font-medium leading-[344px]">30</h3>
        <span className="font-medium text-xl">
          $30/mo early adopter plan, free while in beta
        </span>
        <span className="mt-2">Additional team members $9/mo</span>

        <div className="mt-6">
          <CTAButtons />
        </div>
      </div>
    </div>
  );
}
