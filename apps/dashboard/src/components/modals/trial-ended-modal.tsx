"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { differenceInDays, isAfter, isEqual, parseISO } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plans } from "../plans";

interface TrialEndedBannerProps {
  createdAt: string;
  plan: string;
  teamId: string;
  discountPrice?: number;
  canChooseStarterPlan: boolean;
}

export function TrialEndedModal({
  createdAt,
  plan,
  teamId,
  discountPrice,
  canChooseStarterPlan,
}: TrialEndedBannerProps) {
  const pathname = usePathname();
  const daysFromCreation = differenceInDays(new Date(), new Date(createdAt));
  const isFourteenDaysFromCreation = daysFromCreation >= 14;
  const cutoffDate = parseISO("2025-04-15");
  const today = new Date();
  const isOnOrAfterCutoffDate =
    isAfter(today, cutoffDate) || isEqual(today, cutoffDate);
  const createdAfterMarch2025 = isAfter(
    new Date(createdAt),
    parseISO("2025-03-01"),
  );

  // Show modal if:
  // 1. On trial plan AND created more than 14 days ago AND date is 2025-04-15 or later
  // OR
  // 2. On trial plan AND created after 2025-03-01 AND it's been 14 days or more since creation
  const showModal =
    plan === "trial" &&
    ((isFourteenDaysFromCreation && isOnOrAfterCutoffDate) ||
      (createdAfterMarch2025 && isFourteenDaysFromCreation));

  if (
    pathname.includes("/settings") ||
    pathname.includes("/support") ||
    !showModal
  ) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-[696px]" hideClose>
        <div className="p-8">
          <DialogHeader>
            <DialogTitle>Trial expired</DialogTitle>
          </DialogHeader>
          <DialogDescription className="mb-8">
            Hope you've enjoyed using Midday so far! Your trial has now ended,
            and it's time to choose a plan to continue using Midday.
          </DialogDescription>

          <Plans
            discountPrice={discountPrice}
            teamId={teamId}
            canChooseStarterPlan={canChooseStarterPlan}
          />

          <p className="text-xs text-muted-foreground mt-4">
            If you decide not to continue, you can remove your account and data
            by going to{" "}
            <Link href="/settings" className="underline">
              Settings
            </Link>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
