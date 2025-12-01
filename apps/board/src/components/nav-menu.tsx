"use client";

import { cn } from "@midday/ui/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdOutlineDashboard, MdOutlineViewList } from "react-icons/md";

const items = [
  {
    path: "/",
    name: "Overview",
    icon: MdOutlineDashboard,
  },
  {
    path: "/queues",
    name: "Queues",
    icon: MdOutlineViewList,
  },
];

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="w-full mt-6">
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            (pathname === "/" && item.path === "/") ||
            (item.path !== "/" && pathname?.startsWith(item.path));

          return (
            <Link key={item.path} href={item.path} className="group">
              <div className="relative">
                {/* Background - only icon size */}
                <div
                  className={cn(
                    "border border-transparent h-[40px] transition-all duration-200 ml-[15px] mr-[15px]",
                    isActive &&
                      "bg-[#F2F1EF] dark:bg-[#1C1C1C] border-[#DCDAD2] dark:border-[#2C2C2C]",
                    "w-[40px]",
                  )}
                />

                {/* Icon - always in same position from sidebar edge */}
                <div className="absolute top-0 left-[15px] w-[40px] h-[40px] flex items-center justify-center dark:text-[#666666] text-black group-hover:!text-primary pointer-events-none">
                  <div className={cn(isActive && "dark:!text-white")}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
