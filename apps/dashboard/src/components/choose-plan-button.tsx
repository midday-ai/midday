"use client";

import { Button } from "@midday/ui/button";
import { useState } from "react";
import { ChoosePlanModal } from "./modals/choose-plan-modal";

export function ChoosePlanButton({
  children,
  initialIsOpen,
  daysLeft,
  hasDiscount,
  discountPrice,
}: {
  children: React.ReactNode;
  initialIsOpen?: boolean;
  daysLeft?: number;
  hasDiscount?: boolean;
  discountPrice?: number;
}) {
  const [isOpen, setIsOpen] = useState(initialIsOpen ?? false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="rounded-full font-normal h-[32px] p-0 px-3 text-xs text-[#878787]"
      >
        {children}
      </Button>
      <ChoosePlanModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        daysLeft={daysLeft}
        hasDiscount={hasDiscount}
        discountPrice={discountPrice}
      />
    </>
  );
}
