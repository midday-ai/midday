"use client";

import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainMenu() {
  const pathname = usePathname();
  const part = pathname?.split("/")[1];

  const items = [
    {
      path: "/",
      icon: Icons.Overview,
    },
    {
      path: "/transactions",
      icon: () => <Icons.Transactions size={20} />,
    },
    {
      path: "/apps",
      icon: Icons.Apps,
    },
    {
      path: "/settings",
      icon: Icons.Settings,
    },
  ];

  return (
    <nav className="mt-6">
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const { path, icon: Icon } = item;
          const isActive =
            (pathname === "/onboarding" && path === "/") ||
            (pathname === "/" && path === "/") ||
            (pathname !== "/" && path.startsWith(`/${part}`));

          return (
            <li
              key={path}
              className={cn(
                "rounded-lg border border-transparent w-[55px] h-[45px] flex items-center justify-center",
                isActive && "bg-secondary border-[#2C2C2C]",
              )}
            >
              <Link href={path}>
                <Icon />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
