"use client";

import { usePathname } from "next/navigation";
import { shouldShowUpgradeContent } from "@/utils/trial";
import { UpgradeContent } from "./upgrade-content";

type TrialGuardProps = {
  plan: string | null | undefined;
  createdAt: string | null | undefined;
  children: React.ReactNode;
};

export function TrialGuard({ plan, createdAt, children }: TrialGuardProps) {
  const pathname = usePathname();

  const showUpgradeContent = shouldShowUpgradeContent(
    plan,
    createdAt,
    pathname,
  );

  if (showUpgradeContent) {
    return <UpgradeContent />;
  }

  return <>{children}</>;
}
