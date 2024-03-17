import { Dock } from "@/components/dock";
import { getStaticParams } from "@/locales/server";
import { Button } from "@midday/ui/button";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import Image from "next/image";
import appIcon from "public/app-icon.png";
import signature from "public/email/signature-dark.png";

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
    <div className="container max-w-[800px] flex flex-col items-center mb-48">
      <h1 className="mt-24 font-medium text-center text-5xl mb-24">
        Be even more efficient with
        <br /> Midday for mac
      </h1>

      <Dock />
      {/* <Image src={appIcon} alt="Download Midday" width={150} height={150} /> */}

      <p className="mb-4 text-2xl	font-medium mt-8">Midday for mac</p>
      <p className="text-[#878787] font-sm">
        Donec risus mi, elementum eu mi vel, ultricies porttitor augue.
        <br /> Interdum et malesuada fames ac ante ipsum primis in faucibus.
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
