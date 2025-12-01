"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { NavMenu } from "./nav-menu";

export function Sidebar() {
  return (
    <aside
      className={cn(
        "h-screen flex-shrink-0 flex-col justify-between fixed top-0 pb-4 items-center hidden md:flex z-50",
        "bg-background border-r border-border",
        "w-[70px]",
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 h-[70px] flex items-center justify-center bg-background border-b border-border w-full",
        )}
      >
        <Link href="/" className="absolute left-[22px] transition-none">
          <Icons.LogoSmall />
        </Link>
      </div>

      <div className="flex flex-col w-full pt-[70px] flex-1">
        <NavMenu />
      </div>
    </aside>
  );
}
