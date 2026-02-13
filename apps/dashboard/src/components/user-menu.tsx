"use client";

import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import Link from "next/link";
import { useUserQuery } from "@/hooks/use-user";
import { SignOut } from "./sign-out";
import { ThemeSwitch } from "./theme-switch";

type Props = {
  onlySignOut?: boolean;
};

export function UserMenu({ onlySignOut }: Props) {
  const { data: user } = useUserQuery();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-full w-8 h-8 cursor-pointer bg-accent">
          {user?.avatarUrl && (
            <AvatarImageNext
              src={user?.avatarUrl}
              alt={user?.fullName ?? ""}
              width={32}
              height={32}
              quality={100}
            />
          )}
          <AvatarFallback>
            <span className="text-xs">
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" sideOffset={10} align="end">
        {!onlySignOut && (
          <>
            <DropdownMenuLabel>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="truncate line-clamp-1 max-w-[155px] block text-xs">
                    {user?.fullName}
                  </span>
                  <span className="truncate text-xs text-[#606060] font-normal">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link href="/account">
                <DropdownMenuItem className="text-xs">Account</DropdownMenuItem>
              </Link>

              <Link href="/account/support">
                <DropdownMenuItem className="text-xs">Support</DropdownMenuItem>
              </Link>

              <Link href="/account/teams">
                <DropdownMenuItem className="text-xs">Teams</DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <div className="flex flex-row justify-between items-center p-2">
              <p className="text-xs">Theme</p>
              <ThemeSwitch />
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <SignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
