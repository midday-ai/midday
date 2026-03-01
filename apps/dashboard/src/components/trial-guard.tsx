"use client";

import { usePathname } from "next/navigation";
import { shouldShowUpgradeContent } from "@/utils/trial";
import { UpgradeContent } from "./upgrade-content";

type TrialGuardProps = {
  plan: string | null | undefined;
  createdAt: string | null | undefined;
  user: {
    fullName: string | null;
  };
  currency?: string;
  children: React.ReactNode;
};

export function TrialGuard({
  plan,
  createdAt,
  user,
  currency,
  children,
}: TrialGuardProps) {
  const pathname = usePathname();

  // Re-evaluate on every render (which happens on navigation)
  const showUpgradeContent = shouldShowUpgradeContent(
    plan,
    createdAt,
    pathname,
  );

  if (showUpgradeContent) {
    return <UpgradeContent user={user} currency={currency} />;
  }

  return <>{children}</>;
}
