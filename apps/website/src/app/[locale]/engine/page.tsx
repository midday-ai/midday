import { SparklesCore } from "@/components/sparkles";
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
        <h1 className="text-5xl text-center text-white relative z-20 font-medium">
          One API to rule them all
        </h1>

        <p className="text-[#707070] mt-4">
          Midday gives you the power to manage your invoices, expenses, time
          <br />
          tracking and more. Export seamlessly to your accountant.
        </p>

        <Image
          src={require("public/engine.png")}
          width={419}
          height={421}
          className="mt-12"
        />
      </div>

      <SparklesCore
        background="transparent"
        minSize={0.4}
        maxSize={1}
        particleDensity={40}
        className="w-full h-full absolute top-0 right-0 bottom-0 left-0"
        particleColor="#FFFFFF"
      />
    </div>
  );
}
