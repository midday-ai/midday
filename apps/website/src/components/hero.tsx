import { Button } from "@midday/ui/button";
import Link from "next/link";
import { HeroImage } from "./hero-image";
import { Metrics } from "./metrics";
import { WordAnimation } from "./word-animation";

export function Hero() {
  return (
    <section className="mt-[60px] lg:mt-[180px] min-h-[530px] relative lg:h-[calc(100vh-300px)]">
      <div className="flex flex-col">
        <Link href="/updates/january-product-update">
          <Button
            variant="outline"
            className="rounded-full border-border flex space-x-2 items-center"
          >
            <span className="font-mono text-xs">January Product Updates</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={12}
              fill="none"
            >
              <path
                fill="currentColor"
                d="M8.783 6.667H.667V5.333h8.116L5.05 1.6 6 .667 11.333 6 6 11.333l-.95-.933 3.733-3.733Z"
              />
            </svg>
          </Button>
        </Link>

        <h2 className="mt-6 md:mt-10 max-w-[580px] text-[#878787] leading-tight text-[24px] md:text-[36px] font-medium">
          Invoicing, Time tracking, File reconciliation, Storage, Financial
          Overview & your own Assistant made for <WordAnimation />
        </h2>

        <div className="mt-8 md:mt-10">
          <div className="flex items-center space-x-4">
            <Link
              href="https://cal.com/pontus-midday/15min"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-transparent h-11 px-6 dark:bg-[#1D1D1D] bg-[#F2F1EF]"
              >
                Talk to founders
              </Button>
            </Link>

            <a href="https://app.midday.ai">
              <Button className="h-11 px-5">Start free trial</Button>
            </a>
          </div>
        </div>

        <p className="text-xs text-[#707070] mt-4 font-mono">
          Start free trial, no credit card required.
        </p>
      </div>

      <HeroImage />
      <Metrics />
    </section>
  );
}
