"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
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
import { SignOut } from "./sign-out";
import { ThemeSwitch } from "./theme-switch";

type Props = {
  onlySignOut?: boolean;
};

export function UserMenu({ onlySignOut }: Props) {
  const t = useI18n();
  const { data: user } = useUserQuery();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("user_menu.account")}
          className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
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
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full max-w-[240px]" sideOffset={10} align="end">
        {!onlySignOut && (
          <>
            <DropdownMenuLabel>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="truncate line-clamp-1 max-w-[155px] block text-xs">
                    {user?.fullName}
                  </span>
                  <span className="truncate text-xs text-[#606060] dark:text-[#a0a0a0] font-normal">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link prefetch href="/account">
                <DropdownMenuItem className="text-xs">{t("user_menu.account")}</DropdownMenuItem>
              </Link>

              <Link prefetch href="/account/support">
                <DropdownMenuItem className="text-xs">{t("user_menu.support")}</DropdownMenuItem>
              </Link>

              <Link prefetch href="/account/teams">
                <DropdownMenuItem className="text-xs">{t("user_menu.teams")}</DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <div className="flex flex-row justify-between items-center p-2">
              <p className="text-xs">{t("user_menu.theme")}</p>
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
