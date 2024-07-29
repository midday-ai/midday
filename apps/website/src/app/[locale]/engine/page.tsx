import { SubscribeInput } from "@/components/subscribe-input";
import type { Metadata } from "next";
import Image from "next/image";
import engineSDK from "public/engine-sdk.png";
import engine from "public/engine-ui.png";

export const metadata: Metadata = {
  title: "Engine",
  description:
    "Midday engine streamlines banking integrations with a single API effortlessly connecting to multiple providers and get one unified format.",
};

export default function Page() {
  return (
    <div className="w-full bg-[#0C0C0C] flex flex-col items-center justify-center mt-24">
      <h1 className="text-[100px] md:text-[170px] font-medium text-center text-white relative z-20 leading-none">
        One API
      </h1>

      <h2 className="text-[100px] md:text-[170px] leading-none text-dotted text-center">
        to rule them all
      </h2>

      <div className="mb-2 mt-6">
        <p className="text-[#707070] mt-4 mb-8 text-center max-w-[550px]">
          Midday engine streamlines banking integrations with a single API
          effortlessly connecting to multiple providers and get one unified
          format.
        </p>
      </div>

      <SubscribeInput group="engine" />

      <div className="text-center flex flex-col items-center mt-[140px]">
        <h3 className="mb-4 text-2xl font-medium">
          Unlimited bank connections
        </h3>
        <p className="text-[#878787] font-sm max-w-[600px]">
          Expand your market reach by enabling multiple banking providers with
          just one click. We add even more providers in the future.
        </p>

        <Image
          src={engine}
          alt="Engine UI"
          width={1026}
          height={552}
          className="mt-16"
          quality={100}
        />
      </div>

      <div className="text-center flex flex-col items-center mt-24">
        <h3 className="mb-4 text-2xl font-medium">
          One SDK, implement in minutes
        </h3>
        <p className="text-[#878787] font-sm max-w-[600px]">
          With Midday Engine SDK you can implement banking providers in matter
          of minutes.
        </p>

        <Image
          src={engineSDK}
          alt="Engine SDK"
          width={740}
          height={420}
          className="mt-8"
        />
      </div>
    </div>
  );
}
