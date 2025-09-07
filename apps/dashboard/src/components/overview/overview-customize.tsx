"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { usePathname } from "next/navigation";

export function OverviewCustomize() {
  const pathname = usePathname();

  const isOnRootPath = pathname === "/" || pathname === "";

  if (!isOnRootPath) {
    return null;
  }

  return (
    <Button variant="outline" className="space-x-2">
      <span>Customize</span>
      <Icons.DashboardCustomize size={16} className="text-[#666]" />
    </Button>
  );
}
