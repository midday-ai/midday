"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { usePathname } from "next/navigation";
import { useIsCustomizing, useWidgetActions } from "./widget-provider";

export function Customize() {
  const pathname = usePathname();
  const isCustomizing = useIsCustomizing();
  const { setIsCustomizing } = useWidgetActions();

  const isOnRootPath = pathname === "/" || pathname === "";

  if (!isOnRootPath) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="space-x-2 px-3"
      onClick={() => setIsCustomizing(!isCustomizing)}
    >
      <span>{isCustomizing ? "Save" : "Customize"}</span>
      {isCustomizing ? (
        <Icons.Check size={16} />
      ) : (
        <Icons.DashboardCustomize size={16} />
      )}
    </Button>
  );
}
