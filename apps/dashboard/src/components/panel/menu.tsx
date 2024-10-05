"use client";

import { signOutAction } from "@/actions/sign-out-action";
import { getMenuList } from "@/utils/lib";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { ScrollArea } from "@midday/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { Ellipsis, Loader2, LogOut, LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";

import { SignOut } from "../sign-out";
import { TeamMenu } from "../team-menu";
import { CollapseMenuButton } from "./collapse-menu-button";

/**
 * Interface for a submenu item
 */
interface Submenu {
  href: string;
  label: string;
  active: boolean;
}

/**
 * Interface for a menu item
 */
interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  submenus: Submenu[];
}

/**
 * Interface for a menu group
 */
interface MenuGroup {
  groupLabel?: string;
  menus: MenuItem[];
}

/**
 * Props for the Menu component
 */
interface MenuProps {
  /** Indicates whether the sidebar is open */
  isOpen: boolean | undefined;
}

/**
 * Menu component that renders a scrollable navigation menu with collapsible sections.
 *
 * @param {MenuProps} props - The component props
 * @returns {React.ReactElement} The rendered Menu component
 */
export const Menu: React.FC<MenuProps> = React.memo(({ isOpen }) => {
  const pathname = usePathname();
  const menuList = useMemo(() => getMenuList(pathname), [pathname]);

  const [isLoading, setLoading] = useState(false);

  // this is needed to ensure we can adequately sign out users
  const handleSignOut = async () => {
    setLoading(true);
    signOutAction();
  };

  /**
   * Renders a group label based on the sidebar's open state
   *
   * @param {string | undefined} groupLabel - The label for the group
   * @returns {React.ReactNode} The rendered group label
   */
  const renderGroupLabel = (
    groupLabel: string | undefined,
  ): React.ReactNode => {
    if ((isOpen && groupLabel) || isOpen === undefined) {
      return (
        <p className="max-w-[248px] truncate px-4 pb-2 text-sm font-medium text-muted-foreground">
          {groupLabel}
        </p>
      );
    } else if (!isOpen && isOpen !== undefined && groupLabel) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger className="w-full">
              <div className="flex w-full items-center justify-center">
                <Ellipsis className="h-5 w-5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{groupLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return <p className="pb-2"></p>;
    }
  };

  /**
   * Renders a single menu item
   *
   * @param {MenuItem} menuItem - The menu item to render
   * @param {number} index - The index of the menu item
   * @returns {React.ReactNode} The rendered menu item
   */
  const renderMenuItem = (
    menuItem: MenuItem,
    index: number,
  ): React.ReactNode => {
    const { href, label, icon: Icon, active, submenus } = menuItem;

    if (submenus.length === 0) {
      return (
        <div className="w-full" key={index}>
          <TooltipProvider disableHoverableContent>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="mb-1 h-10 w-full justify-start"
                  asChild
                >
                  <Link href={href}>
                    <span className={cn(isOpen === false ? "" : "mr-4")}>
                      <Icon size={24} strokeWidth={"0.5"} viewBox="0 0 24 24" />
                    </span>
                    <p
                      className={cn(
                        "max-w-[200px] truncate",
                        isOpen === false
                          ? "-translate-x-96 opacity-0"
                          : "translate-x-0 opacity-100",
                      )}
                    >
                      {label}
                    </p>
                  </Link>
                </Button>
              </TooltipTrigger>
              {isOpen === false && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    } else {
      return (
        <div className="w-full" key={index}>
          <CollapseMenuButton
            icon={Icon}
            label={label}
            active={active}
            submenus={submenus}
            isOpen={isOpen}
          />
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="[&>div>div[style]]:!block scrollbar-hide overflow-y-auto flex-grow">
        <nav className="mt-8 h-full w-full">
          <ul className="flex flex-col items-start space-y-1 p-[1.5%]">
            {menuList.map((menuGroup: MenuGroup, groupIndex: number) => (
              <li
                className={cn("w-full", menuGroup.groupLabel ? "pt-5" : "")}
                key={groupIndex}
              >
                {renderGroupLabel(menuGroup.groupLabel)}
                {menuGroup.menus.map(renderMenuItem)}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
});

Menu.displayName = "Menu";
