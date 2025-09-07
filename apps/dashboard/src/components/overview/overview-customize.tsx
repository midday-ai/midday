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
    <Button variant="outline" size="icon">
      <Icons.Settings size={16} />
    </Button>
  );
}
