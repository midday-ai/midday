import { CopyInput } from "@/components/copy-input";
import { Keyboard } from "@/components/keyboard";
import { Button } from "@midday/ui/button";
import type { Metadata } from "next";
import Image from "next/image";
import appIcon from "public/app-icon.png";

export const metadata: Metadata = {
  title: "Download",
  description:
    "With Midday on Mac you have everything accessible just one click away.",
};

export default function Page() {
  return (
    <div className="container flex flex-col items-center mb-12 md:mb-48 text-center">
      <h1 className="mt-24 font-medium text-center text-5xl mb-24">
        Always at your fingertips.
      </h1>

      <Keyboard />

      <Image
        src={appIcon}
        alt="Midday App"
        width={120}
        height={120}
        quality={90}
        className="w-[80px] h-[80px] mt-12 md:mt-0 md:h-auto md:w-auto"
      />
      <p className="mb-4 text-2xl	font-medium mt-8">Midday for Mac</p>
      <p className="text-[#878787] font-sm max-w-[500px]">
        With Midday on Mac you have everything <br />
        accessible just one click away.
      </p>

      <div className="flex gap-3 mt-8 w-full max-w-xs mb-2">
        <a
          href="/api/download?platform=aarch64"
          download
          className="w-full"
          tabIndex={-1}
        >
          <Button
            variant="default"
            className="w-full h-12 px-6 flex items-center justify-center gap-2 border border-primary"
            size="lg"
          >
            <span>Apple Silicon</span>
          </Button>
        </a>
        <a
          href="/api/download?platform=x64"
          download
          className="w-full"
          tabIndex={-1}
        >
          <Button
            variant="outline"
            className="w-full h-12 px-6 flex items-center justify-center gap-2 border border-primary"
            size="lg"
          >
            <span>Intel Macs</span>
          </Button>
        </a>
      </div>
      <p className="text-xs text-[#878787] mt-2">
        Not sure? Most Macs since 2020 use Apple Silicon (M1/M2/M3).
      </p>
    </div>
  );
}
