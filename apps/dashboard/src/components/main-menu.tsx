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
      name: "Overview",
      icon: () => <Icons.Overview size={22} />,
    },
    {
      path: "/bills",
      name: "Bills",
      icon: () => <Icons.Inbox2 size={22} />,
    },
    {
      path: "/transactions",
      name: "Transactions",
      icon: () => <Icons.Transactions size={22} />,
    },
    {
      path: "/invoices",
      name: "Invoices",
      icon: () => <Icons.Invoice size={22} />,
    },
    {
      path: "/timer",
      name: "Timer",
      icon: () => <Icons.Timer size={22} />,
    },
    {
      path: "/vault",
      name: "Vault",
      icon: () => <Icons.Files size={22} />,
    },
    {
      path: "/apps",
      name: "Apps",
      icon: () => <Icons.Apps size={22} />,
    },
    {
      path: "/settings",
      name: "Settings",
      icon: () => <Icons.Settings size={22} />,
    },
  ];

  return (
    <nav className="mt-6 ml-1">
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const { path, icon: Icon, name } = item;
          const isActive =
            (pathname === "/onboarding" && path === "/") ||
            (pathname === "/" && path === "/") ||
            (pathname !== "/" && path.startsWith(`/${part}`));

          return (
            <li
              key={path}
              className={cn(
                "rounded-lg border border-transparent w-[55px] h-[45px] flex items-center justify-center",
                isActive &&
                  "bg-secondary border-[#DCDAD2] dark:border-[#2C2C2C]"
              )}
            >
              <Link href={path} className="flex space-x-3 p-0 items-center">
                <Icon />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
