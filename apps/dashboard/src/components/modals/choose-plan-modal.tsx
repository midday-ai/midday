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
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  daysLeft?: number;
  hasDiscount?: boolean;
  discountPrice?: number;
}) {
  const handleClose = (value: boolean) => {
    onOpenChange(value);
  };

  const getTitle = () => {
    if (daysLeft && daysLeft > 0) {
      return `Pro trial - ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
    }

    return hasDiscount ? "Special Discount Offer" : "Choose plan";
  };

  const getDescription = () => {
    if (daysLeft !== undefined) {
      if (daysLeft > 0) {
        return `Your trial will end in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}, after the trial period you will have read access only.`;
      }

      return "Your trial period has ended. Please choose a plan to continue using Midday.";
    }

    if (hasDiscount && discountPrice) {
      const saveAmount = 99 - discountPrice;
      const savePercentage = Math.round((saveAmount / 99) * 100);

      return `As a valued early customer, you qualify for our special discount pricing. Get the Pro plan for $${discountPrice}/month instead of the regular $99/month and save ${savePercentage}%.`;
    }

    return "Choose a plan to continue using Midday.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[696px]">
        <div className="p-8">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="mb-8">
            {getDescription()}
          </DialogDescription>

          <Plans />

          <p className="text-xs text-muted-foreground mt-4">
            After the trial period ends, you'll have read-only access,{" "}
            <Link href="/support">contact us</Link> if you have any questions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
