import { AdaptiveImage } from "@/components/adaptive-image";
import { getStaticParams } from "@/locales/server";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import Image from "next/image";
import signature from "public/email/signature-dark.png";
import signatureLight from "public/email/signature.png";
import founders from "public/founders.png";

export const metadata: Metadata = {
  title: "Story | Midday",
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
    <div className="container max-w-[800px]">
      <h1 className="mt-24 font-medium text-center text-5xl mb-8">Why?</h1>

      <p className="text-2xl font-normal mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam tincidunt,
        nunc non efficitur interdum, mauris tellus maximus dolor.
      </p>

      <p className="text-[#878787] mb-8">
        Suspendisse mattis libero vitae eros tincidunt porttitor in eget nulla.
        Nulla at justo blandit, facilisis dui at, porttitor sapien. Sed vitae
        nulla ac sapien ornare iaculis. Nunc in accumsan lorem. Curabitur et
        ligula metus.
      </p>

      <p className="text-[#878787] mb-4">
        Donec risus mi, elementum eu mi vel, ultricies porttitor augue. Interdum
        et malesuada fames ac ante ipsum primis in faucibus. Aenean vel cursus
        metus, non convallis mauris. Integer a sodales leo.
      </p>

      <p className="text-[#878787] mb-4">
        Nullam ut risus quis elit suscipit efficitur. Nam rhoncus posuere
        mauris, vel porttitor elit mattis at. In sodales odio non erat bibendum
        eleifend. Pellentesque ornare fermentum elit at facilisis. Orci varius
        natoque penatibus et magnis dis parturient montes, nascetur ridiculus
        mus. In eu mollis ipsum. Suspendisse luctus lobortis libero malesuada.
      </p>

      <p className="text-[#878787] mb-12">
        Nullam ut risus quis elit suscipit efficitur. Nam rhoncus posuere
        mauris, vel porttitor elit mattis at. In sodales odio non erat bibendum
        eleifend. Pellentesque ornare fermentum elit at facilisis. Orci varius
        natoque penatibus et magnis dis parturient montes, nascetur ridiculus
        mus. In eu mollis ipsum. Suspendisse luctus lobortis libero malesuada.
      </p>

      <Image src={founders} width={800} height={514} alt="Pontus & Viktor" />

      <div className="mt-6 mb-8">
        <p className="text-sm text-[#878787] mb-2">Best regards, founders</p>
        <AdaptiveImage
          darkSrc={signature}
          lightSrc={signatureLight}
          alt="Signature"
          className="block w-[143px] h-[20px]"
        />
      </div>
    </div>
  );
}
