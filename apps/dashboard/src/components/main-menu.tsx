"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { usePermissions } from "@/hooks/use-permissions";
import type { TeamRole } from "@/utils/role-permissions";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const INTERNAL: TeamRole[] = ["owner", "admin", "member"];

const icons = {
  "/": () => <Icons.Overview size={20} />,
  "/accounts": () => <Icons.Accounts size={20} />,
  "/transactions": () => <Icons.Transactions size={20} />,
  "/invoices": () => <Icons.Invoice size={20} />,
  "/merchants": () => <Icons.Customers size={20} />,
  "/brokers": () => <Icons.Broker size={20} />,
  "/syndications": () => <Icons.Syndication size={20} />,
  "/underwriting": () => <Icons.Tax size={20} />,
  "/reconciliation": () => <Icons.Reconciliation size={20} />,
  "/settings": () => <Icons.Settings size={20} />,
  "/inbox": () => <Icons.Inbox2 size={20} />,
  "/broker/deals": () => <Icons.Invoice size={20} />,
  "/broker/commissions": () => <Icons.Reconciliation size={20} />,
} as const;

type MenuItem = {
  path: string;
  name: string;
  roles?: TeamRole[];
  children?: { path: string; name: string; roles?: TeamRole[] }[];
};

const allItems: MenuItem[] = [
  {
    path: "/",
    name: "Overview",
  },
  {
    path: "/accounts",
    name: "Accounts",
    roles: INTERNAL,
    children: [
      { path: "/settings/accounts", name: "Connect a bank" },
    ],
  },
  {
    path: "/transactions",
    name: "Transactions",
    roles: INTERNAL,
    children: [
      {
        path: "/transactions?step=import&hide=true",
        name: "Import",
      },
      { path: "/transactions?createTransaction=true", name: "Create new" },
    ],
  },
  {
    path: "/inbox",
    name: "Inbox",
    roles: INTERNAL,
    children: [{ path: "/inbox/settings", name: "Settings" }],
  },
  {
    path: "/invoices",
    name: "Deals",
    children: [
      { path: "/invoices?createDeal=true", name: "Create new", roles: INTERNAL },
    ],
  },
  {
    path: "/merchants",
    name: "Merchants",
    roles: INTERNAL,
    children: [{ path: "/merchants?createMerchant=true", name: "Add new" }],
  },
  {
    path: "/brokers",
    name: "Brokers",
    roles: INTERNAL,
    children: [{ path: "/brokers?createBroker=true", name: "Add new" }],
  },
  {
    path: "/broker/deals",
    name: "My Deals",
    roles: ["broker"],
  },
  {
    path: "/broker/commissions",
    name: "My Commissions",
    roles: ["broker"],
  },
  {
    path: "/syndications",
    name: "Syndications",
    roles: [...INTERNAL, "syndicate"],
    children: [
      { path: "/syndications?createSyndicator=true", name: "Add new", roles: INTERNAL },
    ],
  },
  {
    path: "/underwriting",
    name: "Underwriting",
    roles: INTERNAL,
  },
  {
    path: "/reconciliation",
    name: "Reconciliation",
    roles: [...INTERNAL, "bookkeeper"],
    children: [
      { path: "/reconciliation", name: "Payment Feed" },
      { path: "/reconciliation/ach", name: "ACH Batches" },
      { path: "/reconciliation/exports", name: "Exports" },
    ],
  },
  {
    path: "/settings",
    name: "Settings",
    roles: [...INTERNAL, "bookkeeper"],
    children: [
      { path: "/settings", name: "General" },
      { path: "/settings/billing", name: "Billing", roles: ["owner"] },
      { path: "/settings/accounts", name: "Bank Connections", roles: ["owner", "admin"] },
      { path: "/settings/members", name: "Members", roles: ["owner", "admin"] },
      { path: "/settings/notifications", name: "Notifications", roles: INTERNAL },
      { path: "/settings/developer", name: "Developer", roles: ["owner"] },
    ],
  },
];

// Known menu base paths that should not be treated as chat IDs
const KNOWN_MENU_PATHS = [
  "/accounts",
  "/transactions",
  "/inbox",
  "/invoices",
  "/merchants",
  "/brokers",
  "/syndications",
  "/underwriting",
  "/reconciliation",
  "/settings",
  "/broker",
];

interface ItemProps {
  item: {
    path: string;
    name: string;
    children?: { path: string; name: string }[];
  };
  isActive: boolean;
  isExpanded: boolean;
  isItemExpanded: boolean;
  onToggle: (path: string) => void;
  onSelect?: () => void;
}

const ChildItem = ({
  child,
  isActive,
  isExpanded,
  shouldShow,
  onSelect,
  index,
}: {
  child: { path: string; name: string };
  isActive: boolean;
  isExpanded: boolean;
  shouldShow: boolean;
  onSelect?: () => void;
  index: number;
}) => {
  const showChild = isExpanded && shouldShow;

  return (
    <Link
      prefetch
      href={child.path}
      onClick={() => onSelect?.()}
      className="block group/child"
    >
      <div className="relative">
        {/* Child item text */}
        <div
          className={cn(
            "ml-[35px] mr-[15px] h-[32px] flex items-center",
            "border-l border-[#e6e6e6] dark:border-[#1d1d1d] pl-3",
            "transition-all duration-200 ease-out",
            showChild
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2",
          )}
          style={{
            transitionDelay: showChild
              ? `${40 + index * 20}ms`
              : `${index * 20}ms`,
          }}
        >
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              "text-[#888] group-hover/child:text-primary",
              "whitespace-nowrap overflow-hidden",
              isActive && "text-primary",
            )}
          >
            {child.name}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Item = ({
  item,
  isActive,
  isExpanded,
  isItemExpanded,
  onToggle,
  onSelect,
}: ItemProps) => {
  const Icon = icons[item.path as keyof typeof icons];
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  // Children should be visible when: expanded sidebar AND this item is expanded
  const shouldShowChildren = isExpanded && isItemExpanded;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(item.path);
  };

  return (
    <div className="group">
      <Link
        prefetch
        href={item.path}
        onClick={() => onSelect?.()}
        className="group"
      >
        <div className="relative">
          {/* Background that expands */}
          <div
            className={cn(
              "border border-transparent h-[40px] transition-all duration-200 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; ml-[15px] mr-[15px]",
              isActive &&
                "bg-[#f7f7f7] dark:bg-[#131313] border-[#e6e6e6] dark:border-[#1d1d1d]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]",
            )}
          />

          {/* Icon - always in same position from sidebar edge */}
          <div className="absolute top-0 left-[15px] w-[40px] h-[40px] flex items-center justify-center dark:text-[#666666] text-black group-hover:!text-primary pointer-events-none">
            <div className={cn(isActive && "dark:!text-white")}>
              <Icon />
            </div>
          </div>

          {isExpanded && (
            <div className="absolute top-0 left-[55px] right-[4px] h-[40px] flex items-center pointer-events-none">
              <span
                className={cn(
                  "text-sm font-medium transition-opacity duration-200 ease-in-out text-[#666] group-hover:text-primary",
                  "whitespace-nowrap overflow-hidden",
                  hasChildren ? "pr-2" : "",
                  isActive && "text-primary",
                )}
              >
                {item.name}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={handleChevronClick}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center transition-all duration-200 ml-auto mr-3",
                    "text-[#888] hover:text-primary pointer-events-auto",
                    isActive && "text-primary/60",
                    shouldShowChildren && "rotate-180",
                  )}
                >
                  <Icons.ChevronDown size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Children */}
      {hasChildren && (
        <div
          className={cn(
            "transition-all duration-300 ease-out overflow-hidden",
            shouldShowChildren ? "max-h-96 mt-1" : "max-h-0",
          )}
        >
          {item.children!.map((child, index) => {
            const isChildActive = pathname === child.path;
            return (
              <ChildItem
                key={child.path}
                child={child}
                isActive={isChildActive}
                isExpanded={isExpanded}
                shouldShow={shouldShowChildren}
                onSelect={onSelect}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

type Props = {
  onSelect?: () => void;
  isExpanded?: boolean;
};

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const pathname = usePathname();
  const { isChatPage } = useChatInterface();
  const { role } = usePermissions();
  const part = pathname?.split("/")[1];
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Filter menu items based on user's role
  const items = useMemo(() => {
    return allItems
      .filter((item) => !item.roles || item.roles.includes(role))
      .map((item) => ({
        ...item,
        children: item.children?.filter(
          (child) => !child.roles || child.roles.includes(role),
        ),
      }));
  }, [role]);

  // Check if current pathname is a known menu path (including sub-paths)
  const pathnameWithoutQuery = pathname?.split("?")[0] || "";
  const isKnownMenuPath = KNOWN_MENU_PATHS.some((knownPath) =>
    pathnameWithoutQuery.startsWith(knownPath),
  );

  // Only treat as chat page if isChatPage is true AND it's not a known menu path
  const isValidChatPage = isChatPage && !isKnownMenuPath;

  // Reset expanded item when sidebar expands/collapses
  useEffect(() => {
    setExpandedItem(null);
  }, [isExpanded]);

  return (
    <div className="mt-6 w-full">
      <nav className="w-full">
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            // Check if current path matches item path or is a child of it
            const isActive =
              (pathname === "/" && item.path === "/") ||
              (item.path === "/" && isValidChatPage) ||
              (pathname !== "/" && item.path.startsWith(`/${part}`));

            return (
              <Item
                key={item.path}
                item={item}
                isActive={isActive}
                isExpanded={isExpanded}
                isItemExpanded={expandedItem === item.path}
                onToggle={(path) => {
                  setExpandedItem(expandedItem === path ? null : path);
                }}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
