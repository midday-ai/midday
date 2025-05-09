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
  "/": () => <Icons.Overview size={20} />,
  "/transactions": () => <Icons.Transactions size={20} />,
  "/invoices": () => <Icons.Invoice size={20} />,
  "/tracker": () => <Icons.Tracker size={20} />,
  "/customers": () => <Icons.Customers size={20} />,
  "/vault": () => <Icons.Vault size={20} />,
  "/settings": () => <Icons.Settings size={20} />,
  "/apps": () => <Icons.Apps size={20} />,
  "/inbox": () => <Icons.Inbox2 size={20} />,
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
                "relative border border-transparent size-[40px] flex items-center md:justify-center",
                "hover:bg-accent hover:border-[#DCDAD2] hover:dark:border-[#2C2C2C] dark:text-[#666666] text-black hover:!text-primary",
                isActive &&
                  "bg-[#F2F1EF] dark:bg-secondary border-[#DCDAD2] dark:border-[#2C2C2C] dark:!text-white",
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
            className="px-3 py-1.5 text-xs hidden md:flex items-center gap-1"
            sideOffset={6}
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
        <div className="flex flex-col gap-2">
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
