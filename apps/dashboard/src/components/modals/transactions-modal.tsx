"use client";

import { ConnectBankButton } from "@/components/connect-bank-button";
import { cn } from "@midday/ui/cn";
import Image from "next/image";
import { useQueryState } from "nuqs";
import TransactionsScreenOneLight from "public/assets/transactions-1-light.png";
import TransactionsScreenOne from "public/assets/transactions-1.png";
import TransactionsScreenTwoLight from "public/assets/transactions-2-light.png";
import TransactionsScreenTwo from "public/assets/transactions-2.png";
import { Fragment, useState } from "react";

const images = [
  { id: 1, src: TransactionsScreenOne, src2: TransactionsScreenOneLight },
  { id: 2, src: TransactionsScreenTwo, src2: TransactionsScreenTwoLight },
];

export function TransactionsModal() {
  const [activeId, setActive] = useState(1);

  // When connect transactions is open
  const [step] = useQueryState("step", {
    shallow: false,
  });

  if (step) {
    return null;
  }

  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xl border dark:border-none dark:p-px text-primary z-50"
      style={{
        background:
          "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #727d8b 50%, rgba(235,248,255,.18) 100%)",
      }}
    >
      <div className="bg-background p-2">
        <div className="p-4">
          <div className="mb-8 space-y-5">
            <h2 className="font-medium text-xl">
              Get real-time transaction data
            </h2>
            <p className="text-[#878787] text-sm">
              Get real-time data and be able to see which transactions are
              missing receipts and categorize. Export & deliver everything
              neatly to your accountant.
            </p>
          </div>

          <div className="pb-8 relative h-[272px]">
            {images.map((image) => (
              <Fragment key={image.id}>
                <Image
                  quality={100}
                  src={image.src}
                  width={486}
                  height={251}
                  alt="Overview"
                  className={cn(
                    "w-full opacity-0 absolute transition-all hidden dark:block",
                    image.id === activeId && "opacity-1"
                  )}
                />

                <Image
                  quality={100}
                  src={image.src2}
                  width={486}
                  height={251}
                  alt="Overview"
                  className={cn(
                    "w-full opacity-0 absolute transition-all block dark:hidden",
                    image.id === activeId && "opacity-1"
                  )}
                />
              </Fragment>
            ))}
          </div>

          <div className="flex justify-between mt-12 items-center">
            <div className="flex space-x-2">
              {images.map((image) => (
                <button
                  type="button"
                  onMouseEnter={() => setActive(image.id)}
                  onClick={() => setActive(image.id)}
                  key={image.id}
                  className={cn(
                    "w-[16px] h-[6px] rounded-full bg-[#1D1D1D] dark:bg-[#D9D9D9] opacity-30 transition-all cursor-pointer",
                    image.id === activeId && "opacity-1"
                  )}
                />
              ))}
            </div>

            <ConnectBankButton />
          </div>
        </div>
      </div>
    </div>
  );
}
