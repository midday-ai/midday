import { Countdown } from "@/components/countdown";
import { Button } from "@midday/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Beta",
  description: "Product Hunt Public beta launch",
};

export default function Page() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <span className="text-[#F5F5F3] border border-border rounded-full font-medium font-mono px-3 text-xs py-1.5 mb-4 bg-[#1D1D1D]">
        Coming soon
      </span>

      <h3 className="font-medium text-center text-3xl mb-4 mt-6 leading-none">
        Product Hunt Public beta launch
      </h3>

      <p className="text-center text-sm text-[#707070]">
        Stay up to date with our public beta launch on
        <br />
        Product Hunt.
      </p>

      <Countdown />

      <div className="mt-24">
        <a href="https://go.midday.ai/htI3aDs">
          <Button className="space-x-2" size="lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={17}
              height={16}
              fill="none"
            >
              <path fill="#121212" d="M16.5 8a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
              <path
                fill="#F5F5F3"
                d="M9.566 8H7.299V5.6h2.267a1.2 1.2 0 1 1 0 2.4Zm0-4H5.699v8h1.6V9.6h2.267a2.8 2.8 0 0 0 0-5.6Z"
              />
            </svg>
            <span className="font-medium">Notify me</span>
          </Button>
        </a>
      </div>
    </div>
  );
}
