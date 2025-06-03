"use client";

import { isDesktopApp } from "@midday/desktop-client/platform";
import { cn } from "@midday/ui/cn";
import { platform } from "@todesktop/client-core";

export function OpenURL({
  href,
  children,
  className,
}: { href: string; children: React.ReactNode; className?: string }) {
  const handleOnClick = () => {
    if (isDesktopApp()) {
      platform.os.openURL(href);
    } else {
      window.open(href, "_blank");
    }
  };

  return (
    <span onClick={handleOnClick} className={cn("cursor-pointer", className)}>
      {children}
    </span>
  );
}
