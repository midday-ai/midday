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
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  daysLeft?: number;
}) {
  const handleClose = (value: boolean) => {
    onOpenChange(value);
  };

  const getTitle = () => {
    if (daysLeft && daysLeft > 0) {
      return `Pro trial — ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
    }

    return "Choose plan";
  };

  const getDescription = () => {
    if (daysLeft !== undefined) {
      if (daysLeft > 0) {
        return `Your trial will end in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}, after the trial period you will have read access only.`;
      }

      return "Your trial period has ended. Please choose a plan to continue using Midday.";
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
