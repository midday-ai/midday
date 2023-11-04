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
      path: "/files",
      name: "Files",
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
    <nav className="mt-6 xl:w-full">
      <ul className="flex flex-col gap-0.5 xl:w-full">
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
                "rounded-lg border border-transparent w-[55px] h-[45px] flex items-center justify-center xl:w-full xl:justify-start",
                isActive && "bg-secondary border-[#2C2C2C]",
              )}
            >
              <Link
                href={path}
                className="flex space-x-3 p-0 items-center xl:py-2 xl:px-4"
              >
                <Icon />
                <span className="hidden xl:inline text-sm">{name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
