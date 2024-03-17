import { SparklesCore } from "@/components/sparkles";
import { WaitlistInput } from "@/components/waitlist-input";
import { getStaticParams } from "@/locales/server";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Engine | Midday",
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
    <div className="w-full bg-[#0C0C0C] flex flex-col items-center justify-center mt-24">
      <h1 className="text-6xl font-medium text-center text-white relative z-20">
        One API to rule them all.
      </h1>

      <p className="text-[#707070] mt-4 mb-8 text-center max-w-[550px]">
        Midday Engine streamlines banking integrations with a single API,
        effortlessly connecting to multiple providers and get one unified
        format.
      </p>
      <div className="max-w-[800px] w-full h-40 relative">
        {/* Gradients */}
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#D9D9D9] to-transparent h-[2px] md:w-3/4 blur-sm" />
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#D9D9D9] to-transparent h-px md:w-3/4" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#D9D9D9] to-transparent h-[5px] md:w-1/4 blur-sm" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#D9D9D9] to-transparent h-px md:w-1/4" />

        {/* Core component */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1.2}
          particleDensity={800}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div className="absolute inset-0 w-full h-full bg-[#0C0C0C] [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
      </div>

      <div className="-mt-[160px] w-full flex items-center flex-col z-10">
        <Image
          src={require("public/engine.png")}
          width={419}
          height={421}
          className="mt-12"
          quality={100}
        />

        <WaitlistInput />
      </div>
    </div>
  );
}
