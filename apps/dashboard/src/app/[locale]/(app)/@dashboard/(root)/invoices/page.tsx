"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import Image from "next/image";
import { Fragment, useState } from "react";
import Invoice1Light from "./invoice-1-light.png";
import Invoice1 from "./invoice-1.png";
import Invoice2Light from "./invoice-2-light.png";
import Invoice2 from "./invoice-2.png";

// export const metadata: Metadata = {
//   title: "Invoices | Midday",
// };

const images = [
  { id: 1, src: Invoice1, src2: Invoice1Light },
  { id: 2, src: Invoice2, src2: Invoice2Light },
];

export default function Invoice() {
  const [activeId, setActive] = useState(1);

  return (
    <div className="h-[calc(100vh-300px)] flex flex-col items-center justify-center w-full]">
      <div className="text-[#878787] rounded-md py-1.5 px-3 border text-sm mb-8">
        Comming soon
      </div>

      <div className="pb-8 relative h-[251px] w-[486px]">
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

      <div className="flex justify-between items-center flex-col mt-8 text-center">
        <h2 className="font-medium mb-4">Create invoices</h2>
        <p className="text-sm text-[#878787]">
          We’re working hard to reimagine the way invoicing gets done. Soon
          <br />
          we’ll be releasing web-based invoicing with extra features, such as
          <br />
          live collaboration and project sync.
        </p>
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
      </div>
    </div>
  );
}
