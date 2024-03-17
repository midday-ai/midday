import { BlurryCircle } from "@/components/blurry-circle";
import { getStaticParams } from "@/locales/server";
import { Button } from "@midday/ui/button";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import Image from "next/image";
import appIcon from "public/app-icon.png";
import panel from "public/panel.png";

export const metadata: Metadata = {
  title: "Download | Midday",
};

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
    <div className="container flex flex-col items-center mb-48 text-center">
      <h1 className="mt-24 font-medium text-center text-5xl mb-24">
        Always at your fingertips.
      </h1>

      <div className="relative">
        <Image
          src={panel}
          alt="Download Midday"
          width={1223}
          height={462}
          className="z-10 relative"
        />
        <BlurryCircle className="absolute -top-[50px] right-[0px] bg-[#3633D0]/5" />
        <BlurryCircle className="absolute bottom-[50px] -left-6 bg-[#A1F5CD]/5" />
        <BlurryCircle className="absolute bottom-0 right-[150px] bg-[#FFECBB]/5" />
      </div>
      <Image
        src={appIcon}
        alt="Midday App"
        width={120}
        height={120}
        className="w-[80px] h-[80px] mt-12 md:mt-0 md:h-auto md:w-auto"
      />
      <p className="mb-4 text-2xl	font-medium mt-8">Midday for mac</p>
      <p className="text-[#878787] font-sm max-w-[500px]">
        Donec risus mi, elementum eu mi vel, ultricies porttitor augue. Interdum
        et malesuada fames ac ante ipsum primis in faucibus.
      </p>

      <a href="https://go.midday.ai/MZVe7Ou" download>
        <Button
          variant="outline"
          className="border border-white h-12 px-6 mt-8"
        >
          Download
        </Button>
      </a>

      <p className="text-xs text-[#878787] mt-4">
        Supports apple silicon & intel
      </p>
    </div>
  );
}
