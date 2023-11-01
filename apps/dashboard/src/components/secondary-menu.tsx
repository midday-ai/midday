"use client";

import { cn } from "@midday/ui/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SecondaryMenu({ items }) {
  const pathname = usePathname();

  return (
    <nav
      className="sticky -top-[1px] z-10 backdrop-blur backdrop-filter bg-opacity-50 py-4"
      style={{ background: "rgba(18, 18, 18,.9)" }}
    >
      <ul className="flex space-x-6 text-sm">
        {items.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "text-[#606060]",
              pathname === item.path &&
                "text-white font-medium underline underline-offset-8",
            )}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </ul>
    </nav>
  );
}
