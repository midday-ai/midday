"use client";

import { requestAccessAction } from "@/actions/request-access-action";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import Invoice1Light from "public/assets/invoice-1-light.png";
import Invoice1 from "public/assets/invoice-1.png";
import Invoice2Light from "public/assets/invoice-2-light.png";
import Invoice2 from "public/assets/invoice-2.png";
import { Fragment, useState } from "react";

const images = [
  { id: 1, src: Invoice1, src2: Invoice1Light },
  { id: 2, src: Invoice2, src2: Invoice2Light },
];

export function EmptyStateInvoice({ hasRequested }: { hasRequested: boolean }) {
  const requestAccess = useAction(requestAccessAction);
  const [activeId, setActive] = useState(1);

  const requested = hasRequested || requestAccess.status === "hasSucceeded";

  return (
    <div className="h-[calc(100vh-200px)] w-full">
      <div className="mt-8 flex flex-col items-center justify-center h-full">
        <div className="text-[#878787] rounded-full py-1.5 px-3 border text-xs mb-8 font-mono">
          Coming soon
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
                  image.id === activeId && "opacity-1",
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
                  image.id === activeId && "opacity-1",
                )}
              />
            </Fragment>
          ))}
        </div>

        <div className="flex justify-between mt-8 items-center">
          <div className="flex space-x-2">
            {images.map((image) => (
              <button
                type="button"
                onMouseEnter={() => setActive(image.id)}
                onClick={() => setActive(image.id)}
                key={image.id}
                className={cn(
                  "w-[16px] h-[6px] rounded-full bg-[#1D1D1D] dark:bg-[#D9D9D9] opacity-30 transition-all cursor-pointer",
                  image.id === activeId && "opacity-1",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center flex-col mt-8 text-center mb-8">
          <h2 className="font-medium mb-4">Create invoices</h2>
          <p className="text-sm text-[#878787]">
            Create web-based invoices in seconds. Have an easy overview <br />
            of all your invoices and see your outstanding balance.
          </p>
        </div>

        <Button
          disabled={requested}
          className="space-x-2"
          onClick={() => requestAccess.execute()}
        >
          {requested ? (
            <span>Requested access</span>
          ) : (
            <span>Request early access</span>
          )}

          {requestAccess.status === "executing" && (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={0.5} />
          )}
          {requested && <Icons.Check />}
        </Button>
      </div>
    </div>
  );
}
