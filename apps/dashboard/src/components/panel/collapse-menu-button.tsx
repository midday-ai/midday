"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Dot, LucideIcon } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo, useState } from "react";

/**
 * Represents a submenu item in the CollapseMenuButton.
 */
interface Submenu {
  /** The URL the submenu item links to */
  href: string;
  /** The display text for the submenu item */
  label: string;
  /** Indicates if this submenu item is currently active */
  active: boolean;
}

/**
 * Props for the CollapseMenuButton component.
 */
interface CollapseMenuButtonProps {
  /** The icon to display for the menu button */
  icon: LucideIcon;
  /** The label text for the menu button */
  label: string;
  /** Indicates if this menu button is currently active */
  active: boolean;
  /** An array of submenu items */
  submenus: Submenu[];
  /** Indicates if the parent sidebar is open */
  isOpen: boolean | undefined;
}

/**
 * A component that renders a single submenu item.
 */
const SubMenuItem: React.FC<Submenu & { isOpen: boolean }> = React.memo(
  ({ href, label, active, isOpen }) => (
    <Button
      variant={active ? "secondary" : "ghost"}
      className="mb-1 h-10 w-full justify-start"
      asChild
    >
      <Link href={href}>
        <span className="ml-2 mr-4">
          <Dot size={18} />
        </span>
        <p
          className={cn(
            "max-w-[170px] truncate",
            isOpen ? "translate-x-0 opacity-100" : "-translate-x-96 opacity-0",
          )}
        >
          {label}
        </p>
      </Link>
    </Button>
  ),
);

SubMenuItem.displayName = "SubMenuItem";

/**
 * A collapsible menu button component that can display either as a dropdown or an expandable list.
 * It adapts its display based on whether the parent sidebar is open or closed.
 */
export const CollapseMenuButton: React.FC<CollapseMenuButtonProps> = React.memo(
  ({ icon: Icon, label, active, submenus, isOpen }) => {
    const isSubmenuActive = useMemo(
      () => submenus.some((submenu) => submenu.active),
      [submenus],
    );
    const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);

    /**
     * Handles the state change of the collapsible component.
     * @param open - The new open state of the collapsible.
     */
    const handleCollapsibleChange = useCallback((open: boolean) => {
      setIsCollapsed(open);
    }, []);

    /**
     * Renders the collapsible content when the sidebar is open.
     */
    const renderCollapsibleContent = useCallback(
      () => (
        <Collapsible
          open={isCollapsed}
          onOpenChange={handleCollapsibleChange}
          className="w-full"
        >
          <CollapsibleTrigger
            className="mb-1 [&[data-state=open]>div>div>svg]:rotate-180"
            asChild
          >
            <Button
              variant={active ? "secondary" : "ghost"}
              className="h-10 w-full justify-start"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-4">
                    <Icon size={18} />
                  </span>
                  <p
                    className={cn(
                      "max-w-[150px] truncate",
                      isOpen
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-96 opacity-0",
                    )}
                  >
                    {label}
                  </p>
                </div>
                <div
                  className={cn(
                    "whitespace-nowrap",
                    isOpen
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-96 opacity-0",
                  )}
                >
                  <ChevronDown
                    size={18}
                    className="transition-transform duration-200"
                  />
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            {submenus.map((submenu, index) => (
              <SubMenuItem key={index} {...submenu} isOpen={!!isOpen} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ),
      [
        Icon,
        active,
        handleCollapsibleChange,
        isCollapsed,
        isOpen,
        label,
        submenus,
      ],
    );

    /**
     * Renders the dropdown menu when the sidebar is closed.
     */
    const renderDropdownMenu = useCallback(
      () => (
        <DropdownMenu>
          <TooltipProvider disableHoverableContent>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className="mb-1 h-10 w-full justify-start"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <span className={cn(isOpen === false ? "" : "mr-4")}>
                          <Icon size={18} />
                        </span>
                        <p
                          className={cn(
                            "max-w-[200px] truncate",
                            isOpen === false ? "opacity-0" : "opacity-100",
                          )}
                        >
                          {label}
                        </p>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" alignOffset={2}>
                {label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent side="right" sideOffset={25} align="start">
            <DropdownMenuLabel className="max-w-[190px] truncate">
              {label}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {submenus.map(({ href, label }, index) => (
              <DropdownMenuItem key={index} asChild>
                <Link className="cursor-pointer" href={href}>
                  <p className="max-w-[180px] truncate">{label}</p>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuArrow className="fill-border" />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      [Icon, active, isOpen, label, submenus],
    );

    return isOpen ? renderCollapsibleContent() : renderDropdownMenu();
  },
);

CollapseMenuButton.displayName = "CollapseMenuButton";
