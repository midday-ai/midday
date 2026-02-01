"use client";

import { cn } from "@midday/ui/cn";
import { usePathname } from "next/navigation";
import { ForesightLink } from "./foresight-link";

type Item = {
  path: string;
  label: string;
};

type Props = {
  items: Item[];
};

export function SecondaryMenu({ items }: Props) {
  const pathname = usePathname();

  return (
    <nav className="py-4">
      <ul className="flex space-x-6 text-sm overflow-auto scrollbar-hide">
        {items.map((item) => (
          <ForesightLink
            key={item.path}
            href={item.path}
            name={`secondary-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={cn(
              "text-[#606060]",
              pathname === item.path &&
                "text-primary font-medium underline underline-offset-8",
            )}
          >
            <span>{item.label}</span>
          </ForesightLink>
        ))}
      </ul>
    </nav>
  );
}
