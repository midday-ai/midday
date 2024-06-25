import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Beta",
  description: "Product Hunt Public beta launch",
};

export default function Page() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div className="text-[#F5F5F3] border border-border rounded-full font-medium font-mono px-3 text-xs py-1.5 mb-4 bg-[#1D1D1D] flex items-center space-x-2">
        <span className="rounded-full size-2 animate-pulse bg-red-600 inline-block" />
        <span>Live now</span>
      </div>

      <h3 className="font-medium text-center text-3xl mb-4 mt-6 leading-none">
        Product Hunt Public beta launch
      </h3>

      <p className="text-center text-sm text-[#707070]">
        Stay up to date with our public beta launch on
        <br />
        Product Hunt.
      </p>

      <div className="mt-8">
        <iframe
          width={560}
          height={315}
          src="https://go.midday.ai/livestream"
          title="Algora TV video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
