"use client";

import { hideConnectFlowAction } from "@/actions/hide-connect-flow-action";
import { AddAccountButton } from "@/components/add-account-button";
import { cn } from "@midday/ui/cn";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import TransactionsScreenOneLight from "public/assets/transactions-1-light.png";
import TransactionsScreenOne from "public/assets/transactions-1.png";
import TransactionsScreenTwoLight from "public/assets/transactions-2-light.png";
import TransactionsScreenTwo from "public/assets/transactions-2.png";
import { Fragment, useState } from "react";

const images = [
  { id: 1, src: TransactionsScreenOne, src2: TransactionsScreenOneLight },
  { id: 2, src: TransactionsScreenTwo, src2: TransactionsScreenTwoLight },
];

export function TransactionsModal({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  const [activeId, setActive] = useState(1);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hideConnectFlow = useAction(hideConnectFlowAction);

  const handleOnOpenChange = () => {
    setIsOpen(!isOpen);

    if (isOpen) {
      hideConnectFlow.execute();
    }
  };

  return (
    <Dialog
      defaultOpen={defaultOpen}
      open={isOpen}
      onOpenChange={handleOnOpenChange}
    >
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <div className="bg-background p-2">
          <div className="p-4">
            <div className="mb-8 space-y-5">
              <h2 className="font-medium text-xl">
                Get real-time transaction data
              </h2>
              <p className="text-[#878787] text-sm">
                Get instant transaction insights. Easily spot missing receipts,
                categorize expenses, and reconcile everything seamlessly for
                accounting.
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
                      image.id === activeId && "opacity-1",
                    )}
                  />
                ))}
              </div>

              <AddAccountButton />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
