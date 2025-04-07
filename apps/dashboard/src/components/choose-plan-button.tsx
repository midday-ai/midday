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
  teamId,
  canChooseStarterPlan,
}: {
  children: React.ReactNode;
  initialIsOpen?: boolean;
  daysLeft?: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  teamId: string;
  canChooseStarterPlan: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialIsOpen ?? false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="rounded-full font-normal h-8 md:h-9 p-0 px-2 md:px-3 text-xs md:text-sm text-[#878787] whitespace-nowrap"
      >
        {children}
      </Button>

      <ChoosePlanModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        daysLeft={daysLeft}
        hasDiscount={hasDiscount}
        discountPrice={discountPrice}
        teamId={teamId}
        canChooseStarterPlan={canChooseStarterPlan}
      />
    </>
  );
}
