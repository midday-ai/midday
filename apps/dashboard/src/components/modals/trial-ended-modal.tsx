"use client";

import { useUserQuery } from "@/hooks/use-user";
import { UTCDate } from "@date-fns/utc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { addDays, differenceInDays, isSameDay, parseISO } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plans } from "../plans";

export function TrialEndedModal() {
  const { data: user } = useUserQuery();
  const pathname = usePathname();

  if (!user?.team?.createdAt) {
    return null;
  }

  // Parse dates using UTCDate for consistent timezone handling
  const rawCreatedAt = parseISO(user?.team?.createdAt!);
  const today = new UTCDate();

  // Convert to UTCDate for consistent calculation
  const createdAt = new UTCDate(rawCreatedAt);

  // Set trial end date 14 days from creation
  const trialEndDate = addDays(createdAt, 14);

  const daysLeft = isSameDay(createdAt, today)
    ? 14
    : Math.max(0, differenceInDays(trialEndDate, today));
  const isTrialEnded = daysLeft <= 0;

  const showModal = user?.team?.plan === "trial" && isTrialEnded;

  if (
    pathname.includes("/settings") ||
    pathname.includes("/support") ||
    !showModal
  ) {
    return null;
  }

  if (!user?.team?.id) {
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

          <Plans />

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
