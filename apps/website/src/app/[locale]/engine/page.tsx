import { SparklesCore } from "@/components/sparkles";
import { WaitlistInput } from "@/components/waitlist-input";
import { WavyBackground } from "@/components/wavy-background";
import { getStaticParams } from "@/locales/server";
import { setStaticParamsLocale } from "next-international/server";
import Image from "next/image";

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center z-10 text-center">
        <h1 className="text-6xl font-medium text-center text-white relative z-20">
          One API to rule them all.
        </h1>

        <p className="text-[#707070] mt-4">
          Midday Engine streamlines banking integrations with a single API,{" "}
          <br />
          effortlessly connecting to multiple providers and get one unified
          format.
        </p>

        <Image
          src={require("public/engine.png")}
          width={419}
          height={421}
          className="mt-12"
        />

        <WaitlistInput />
      </div>

      <SparklesCore
        background="transparent"
        minSize={0.4}
        maxSize={1}
        particleDensity={20}
        className="w-full h-full absolute top-0 right-0 bottom-0 left-0"
        particleColor="#FFFFFF"
      />
    </div>
  );
}
