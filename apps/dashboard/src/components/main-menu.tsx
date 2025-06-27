"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
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
  isExpanded: boolean;
  onSelect?: () => void;
}

const Item = ({ item, isActive, isExpanded, onSelect }: ItemProps) => {
  const Icon = icons[item.path as keyof typeof icons];

  return (
    <Link prefetch href={item.path} onClick={() => onSelect?.()}>
      <div className="relative">
        <div
          className={cn(
            "border border-transparent h-[40px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ml-[15px] mr-[15px]",
            "hover:bg-accent hover:border-[#DCDAD2] hover:dark:border-[#2C2C2C]",
            isActive &&
              "bg-[#F2F1EF] dark:bg-secondary border-[#DCDAD2] dark:border-[#2C2C2C]",
            isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]",
          )}
        />

        {/* Icon - always in same position */}
        <div className="absolute top-0 left-[15px] w-[40px] h-[40px] flex items-center justify-center dark:text-[#666666] text-black hover:!text-primary">
          <div className={cn(isActive && "dark:!text-white")}>
            <Icon />
          </div>
        </div>

        {isExpanded && (
          <div className="absolute top-0 left-[55px] right-[8px] h-[40px] flex items-center">
            <span
              className={cn(
                "text-sm font-medium transition-opacity duration-200 ease-in-out text-[#666]",
                isActive && "text-primary",
              )}
            >
              {item.name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

type Props = {
  onSelect?: () => void;
  isExpanded?: boolean;
};

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const pathname = usePathname();
  const part = pathname?.split("/")[1];

  return (
    <div className="mt-6 w-full">
      <nav className="w-full">
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
                isExpanded={isExpanded}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
