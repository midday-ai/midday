"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import TransactionsScreenOne from "./transactions-1.png";
import TransactionsScreenTwo from "./transactions-2.png";

const images = [
  { id: 1, src: TransactionsScreenOne },
  { id: 2, src: TransactionsScreenTwo },
];

export function TransactionsModal() {
  const [activeId, setActive] = useState(1);

  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xl p-px shadow-lg text-white rounded-lg z-50 "
      style={{
        background:
          "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #727d8b 50%, rgba(235,248,255,.18) 100%)",
      }}
    >
      <div className="bg-background p-2 rounded-[7px]">
        <div className="p-4">
          <div className="mb-8 space-y-5">
            <h2 className="font-medium text-xl">
              Get real time transactions data
            </h2>
            <p className="text-[#878787] text-sm">
              Get real time data and be able to see which transactions are
              missing receipts, categorize, upload and set correct taxrate.
              Export & deliver everything neatly to your accountant.
            </p>
          </div>

          <div className="pb-8 relative h-[272px]">
            {images.map((image) => (
              <Image
                key={image.id}
                src={image.src}
                width={486}
                height={251}
                alt="Overview"
                className={cn(
                  "w-full opacity-0 absolute transition-all",
                  image.id === activeId && "opacity-1",
                )}
              />
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
                    "w-[16px] h-[6px] rounded-full bg-[#D9D9D9] opacity-30 transition-all cursor-pointer",
                    image.id === activeId && "opacity-1",
                  )}
                />
              ))}
            </div>
            <Link href="?step=bank">
              <Button>Connect bank</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
