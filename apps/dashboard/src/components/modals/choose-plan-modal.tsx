"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import Link from "next/link";
import { Plans } from "../plans";

export function ChoosePlanModal({
  isOpen,
  onOpenChange,
  daysLeft,
  hasDiscount,
  discountPrice,
  teamId,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  daysLeft?: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  teamId: string;
}) {
  const getTitle = () => {
    if (daysLeft && daysLeft > 0) {
      return `Pro trial - ${daysLeft} days left`;
    }

    return hasDiscount ? "Special Discount Offer" : "Choose plan";
  };

  const getDescription = () => {
    if (daysLeft !== undefined) {
      if (daysLeft > 0) {
        return `Your trial will end in ${daysLeft} days, after the trail period you will have read access only.`;
      }

      return "Your trial period has ended. Please choose a plan to continue using all features.";
    }

    if (hasDiscount && discountPrice) {
      const saveAmount = 99 - discountPrice;
      const savePercentage = Math.round((saveAmount / 99) * 100);

      return `As a valued early customer, you qualify for our special discount pricing. Get the Pro plan for $${discountPrice}/month instead of the regular $99/month and save ${savePercentage}%.`;
    }

    return "Choose a plan to continue using Midday.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[696px]">
        <div className="p-8">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{getDescription()}</DialogDescription>

          <Plans discountPrice={discountPrice} teamId={teamId} />

          {discountPrice ? (
            <p className="text-xs text-muted-foreground mt-4">
              If you choose not to upgrade, you will only have read access from
              now on and lose out on your discount,{" "}
              <Link href="/support">contact us</Link> if you have any questions.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-4">
              After the trial period ends, you'll have read-only access,{" "}
              <Link href="/support">contact us</Link> if you have any questions.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
