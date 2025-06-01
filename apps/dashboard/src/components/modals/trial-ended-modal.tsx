"use client";

import { useUserQuery } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { differenceInDays } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plans } from "../plans";

export function TrialEndedModal() {
  const { data: user } = useUserQuery();
  const pathname = usePathname();
  const daysFromCreation = differenceInDays(
    new Date(),
    new Date(user?.team?.createdAt!),
  );

  const isFourteenDaysFromCreation = daysFromCreation >= 14;
  const showModal = user?.team?.plan === "trial" && isFourteenDaysFromCreation;

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
