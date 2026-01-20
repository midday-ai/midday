"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const icons = {
  "/": () => <Icons.Overview size={20} />,
  "/transactions": () => <Icons.Transactions size={20} />,
  "/invoices": () => <Icons.Invoice size={20} />,
  "/tracker": () => <Icons.Tracker size={20} />,
  "/expense-approvals": () => <Icons.ReceiptLong size={20} />,
  "/customers": () => <Icons.Customers size={20} />,
  "/vault": () => <Icons.Vault size={20} />,
  "/tax-filing": () => <Icons.Tax size={20} />,
  "/settings": () => <Icons.Settings size={20} />,
  "/apps": () => <Icons.Apps size={20} />,
  "/inbox": () => <Icons.Inbox2 size={20} />,
} as const;

const items = [
  {
    path: "/",
    nameKey: "navigation.overview",
  },
  {
    path: "/transactions",
    nameKey: "navigation.transactions",
    children: [
      {
        path: "/transactions/categories",
        nameKey: "navigation.categories",
      },
      {
        path: "/transactions?step=connect",
        nameKey: "navigation.connect_bank",
      },
      {
        path: "/transactions?step=import&hide=true",
        nameKey: "navigation.import",
      },
      { path: "/transactions?createTransaction=true", nameKey: "navigation.create_new" },
    ],
  },
  {
    path: "/inbox",
    nameKey: "navigation.inbox",
    children: [{ path: "/inbox/settings", nameKey: "navigation.settings" }],
  },
  {
    path: "/invoices",
    nameKey: "navigation.invoices",
    children: [
      { path: "/invoices/products", nameKey: "navigation.products" },
      { path: "/invoices?type=create", nameKey: "navigation.create_new" },
    ],
  },
  {
    path: "/tracker",
    nameKey: "navigation.tracker",
    children: [{ path: "/tracker?create=true", nameKey: "navigation.create_new" }],
  },
  {
    path: "/expense-approvals",
    nameKey: "expense_approval.page.title",
  },
  {
    path: "/customers",
    nameKey: "navigation.customers",
    children: [{ path: "/customers?createCustomer=true", nameKey: "navigation.create_new" }],
  },
  {
    path: "/vault",
    nameKey: "navigation.vault",
  },
  {
    path: "/tax-filing",
    nameKey: "tax_filing.nav.title",
  },
  {
    path: "/apps",
    nameKey: "navigation.apps",
    children: [
      { path: "/apps", nameKey: "navigation.all" },
      { path: "/apps?tab=installed", nameKey: "navigation.installed" },
    ],
  },
  {
    path: "/settings",
    nameKey: "navigation.settings",
    children: [
      { path: "/settings", nameKey: "navigation.general" },
      { path: "/settings/billing", nameKey: "navigation.billing" },
      { path: "/settings/accounts", nameKey: "navigation.bank_connections" },
      { path: "/settings/members", nameKey: "navigation.members" },
      { path: "/settings/notifications", nameKey: "navigation.notifications" },
      { path: "/settings/developer", nameKey: "navigation.developer" },
    ],
  },
];

// Known menu base paths that should not be treated as chat IDs
const KNOWN_MENU_PATHS = [
  "/transactions",
  "/inbox",
  "/invoices",
  "/tracker",
  "/expense-approvals",
  "/customers",
  "/vault",
  "/tax-filing",
  "/apps",
  "/settings",
];

interface ItemProps {
  item: {
    path: string;
    nameKey: string;
    children?: { path: string; nameKey: string }[];
  };
  isActive: boolean;
  isExpanded: boolean;
  isItemExpanded: boolean;
  onToggle: (path: string) => void;
  onSelect?: () => void;
  t: (key: string) => string;
}

const ChildItem = ({
  child,
  isActive,
  isExpanded,
  shouldShow,
  onSelect,
  index,
  t,
}: {
  child: { path: string; nameKey: string };
  isActive: boolean;
  isExpanded: boolean;
  shouldShow: boolean;
  onSelect?: () => void;
  index: number;
  t: (key: string) => string;
}) => {
  const showChild = isExpanded && shouldShow;

  return (
    <Link
      prefetch
      href={child.path}
      onClick={() => onSelect?.()}
      className="block group/child rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative">
        {/* Child item text */}
        <div
          className={cn(
            "ml-[35px] mr-[15px] h-[32px] flex items-center",
            "border-l border-[#e6e6e6] dark:border-[#2a2a2a] pl-3",
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
              "whitespace-nowrap overflow-hidden text-ellipsis",
              isActive && "text-primary",
            )}
          >
            {t(child.nameKey)}
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
  t,
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
                {t(item.nameKey)}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={handleChevronClick}
                  aria-label={t("navigation.toggle_submenu")}
                  aria-expanded={shouldShowChildren}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center transition-all duration-200 ml-auto mr-3",
                    "text-[#888] hover:text-primary pointer-events-auto",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded",
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
                t={t}
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
  const t = useI18n();
  const pathname = usePathname();
  const { isChatPage } = useChatInterface();
  const part = pathname?.split("/")[1];
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
                t={t}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
