"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TrialEndedBannerProps {
  createdAt: string;
  plan: string;
}

export function TrialEndedBanner({ createdAt, plan }: TrialEndedBannerProps) {
  const pathname = usePathname();

  // Check if the trial period has ended (14 days after creation)
  const trialEndDate = new Date(createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + 14);
  const isTrialEnded = new Date() > trialEndDate;

  if (new Date(createdAt) < new Date("2025-03-01")) {
    return null;
  }

  // Only show if trial has ended and user is on trial plan
  if (
    !isTrialEnded ||
    plan !== "trial" ||
    pathname.includes("/settings/billing")
  ) {
    return null;
  }

  return (
    <div className="fixed z-30 md:bottom-10 md:right-7 md:left-20 bottom-4 right-4 left-4 flex items-center justify-between border border-border p-4 backdrop-filter backdrop-blur-xl dark:bg-[#121212]/80 bg-[#F6F6F3]/80">
      <div className="space-y-1">
        <h3 className="text-base font-medium">Pro trial expired</h3>
        <p className="text-sm text-[#878787]">
          You currently only have read access and its time for you to <br />
          upgrade to a paid plan.
        </p>
      </div>
      <Button
        asChild
        className="whitespace-nowrap bg-white/90 text-black hover:bg-white"
      >
        <Link href="/settings/billing">Choose plan</Link>
      </Button>
    </div>
  );
}
