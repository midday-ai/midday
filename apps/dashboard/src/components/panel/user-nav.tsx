"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { LayoutGrid, User } from "lucide-react";
import Link from "next/link";
import React from "react";

import { SignOut } from "../sign-out";

/**
 * UserNav component that renders a user navigation dropdown menu.
 * It includes a user avatar, profile information, and navigation links.
 *
 * @returns {React.ReactElement} The rendered UserNav component
 */
export const UserNav: React.FC = React.memo(() => {
  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="#" alt="User avatar" />
                  <AvatarFallback className="bg-transparent">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <UserInfo />
        <DropdownMenuSeparator />
        <NavLinks />
        <DropdownMenuSeparator />
        <SignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserNav.displayName = "UserNav";

/**
 * UserInfo component that displays the user's name and email.
 */
const UserInfo: React.FC = React.memo(() => (
  <DropdownMenuLabel className="font-normal">
    <div className="flex flex-col space-y-1">
      <p className="text-sm font-medium leading-none">John Doe</p>
      <p className="text-xs leading-none text-muted-foreground">
        johndoe@example.com
      </p>
    </div>
  </DropdownMenuLabel>
));

UserInfo.displayName = "UserInfo";

/**
 * NavLinks component that renders navigation links in the dropdown menu.
 */
const NavLinks: React.FC = React.memo(() => (
  <DropdownMenuGroup>
    <NavLink href="/" icon={LayoutGrid}>
      Dashboard
    </NavLink>
    <NavLink href="/account" icon={User}>
      Account
    </NavLink>
  </DropdownMenuGroup>
));

NavLinks.displayName = "NavLinks";

/**
 * Props for the NavLink component.
 */
interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

/**
 * NavLink component that renders a single navigation link.
 */
const NavLink: React.FC<NavLinkProps> = React.memo(
  ({ href, icon: Icon, children }) => (
    <DropdownMenuItem className="hover:cursor-pointer" asChild>
      <Link href={href} className="flex items-center">
        <Icon className="mr-3 h-4 w-4 text-muted-foreground" />
        {children}
      </Link>
    </DropdownMenuItem>
  ),
);

NavLink.displayName = "NavLink";
