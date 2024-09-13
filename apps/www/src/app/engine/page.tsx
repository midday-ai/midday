import type { Metadata } from "next";
import Image from "next/image";
import { WaitlistInput } from "@/components/waitlist-input";
import engineSDK from "public/engine-sdk.png";
import engine from "public/engine-ui.png";

export const metadata: Metadata = {
  title: "Engine",
};

export default function Page() {
  return (
    <div className="mt-24 flex w-full flex-col items-center justify-center bg-[#0C0C0C]">
      <h1 className="relative z-20 text-center text-[100px] font-medium leading-none text-white md:text-[170px]">
        One API
      </h1>

      <h2 className="text-dotted text-center text-[100px] leading-none md:text-[170px]">
        to rule them all
      </h2>

      <div className="mb-2 mt-6">
        <p className="mb-8 mt-4 max-w-[550px] text-center text-[#707070]">
          Solomon AI engine streamlines banking integrations with a single API
          effortlessly connecting to multiple providers and get one unified
          format.
        </p>
      </div>

      <WaitlistInput />

      <div className="mt-[140px] flex flex-col items-center text-center">
        <h3 className="mb-4 text-2xl font-medium">
          Unlimited bank connections
        </h3>
        <p className="font-sm max-w-[600px] text-[#878787]">
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

      <div className="mt-24 flex flex-col items-center text-center">
        <h3 className="mb-4 text-2xl font-medium">
          One SDK, implement in minutes
        </h3>
        <p className="font-sm max-w-[600px] text-[#878787]">
          With Solomon AI Engine SDK you can implement banking providers in
          matter of minutes.
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
