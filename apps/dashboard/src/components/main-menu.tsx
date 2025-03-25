"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  "/": () => <Icons.Overview size={22} />,
  "/transactions": () => <Icons.Transactions size={22} />,
  "/invoices": () => <Icons.Invoice size={22} />,
  "/tracker": () => <Icons.Tracker size={22} />,
  "/customers": () => <Icons.Customers size={22} />,
  "/vault": () => <Icons.Vault size={22} />,
  "/settings": () => <Icons.Settings size={22} />,
  "/apps": () => <Icons.Apps size={22} />,
  "/inbox": () => <Icons.Inbox2 size={22} />,
} as const;

const items = [
  {
    path: "/",
    name: "Overview",
  },
  {
    path: "/inbox",
    name: "Inbox",
  },
  {
    path: "/transactions",
    name: "Transactions",
  },
  {
    path: "/invoices",
    name: "Invoices",
  },
  {
    path: "/tracker",
    name: "Tracker",
  },
  {
    path: "/customers",
    name: "Customers",
  },
  {
    path: "/vault",
    name: "Vault",
  },
  {
    path: "/apps",
    name: "Apps",
  },
  {
    path: "/settings",
    name: "Settings",
  },
];

interface ItemProps {
  item: { path: string; name: string };
  isActive: boolean;
  onSelect?: () => void;
}

const Item = ({ item, isActive, onSelect }: ItemProps) => {
  const Icon = icons[item.path as keyof typeof icons];

  return (
    <TooltipProvider delayDuration={70}>
      <Link prefetch href={item.path} onClick={() => onSelect?.()}>
        <Tooltip>
          <TooltipTrigger className="w-full">
            <div
              className={cn(
                "relative border border-transparent md:w-[45px] h-[45px] flex items-center md:justify-center",
                "hover:bg-accent hover:border-[#DCDAD2] hover:dark:border-[#2C2C2C]",
                isActive &&
                  "bg-[#F2F1EF] dark:bg-secondary border-[#DCDAD2] dark:border-[#2C2C2C]",
              )}
            >
              <div className="relative">
                <div className="flex space-x-3 p-0 items-center pl-2 md:pl-0">
                  <Icon />
                  <span className="flex md:hidden">{item.name}</span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="px-3 py-1.5 text-xs hidden md:flex"
            sideOffset={10}
          >
            {item.name}
          </TooltipContent>
        </Tooltip>
      </Link>
    </TooltipProvider>
  );
};

type Props = {
  onSelect?: () => void;
};

export function MainMenu({ onSelect }: Props) {
  const pathname = usePathname();
  const part = pathname?.split("/")[1];

  return (
    <div className="mt-6">
      <nav>
        <div className="flex flex-col gap-1.5">
          {items.map((item) => {
            const isActive =
              (pathname === "/" && item.path === "/") ||
              (pathname !== "/" && item.path.startsWith(`/${part}`));

            return (
              <Item
                key={item.path}
                item={item}
                isActive={isActive}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
