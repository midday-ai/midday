import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { Button } from "@midday/ui/button";

export const metadata: Metadata = {
  title: "Public Beta",
};

export default function Page() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <span className="mb-4 rounded-full border border-border bg-[#1D1D1D] px-3 py-1.5 font-mono text-xs font-medium text-[#F5F5F3]">
        Coming soon
      </span>

      <h3 className="mb-4 mt-6 text-center text-3xl font-medium leading-none">
        Product Hunt Public beta launch
      </h3>

      <p className="text-center text-sm text-[#707070]">
        Stay up to date with our public beta launch on
        <br />
        Product Hunt.
      </p>

      <Countdown />

      <div className="mt-24">
        <a href="https://go.solomon-ai.app/htI3aDs">
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
