"use client";

import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useState } from "react";
import { useUserQuery } from "@/hooks/use-user";
import { SignOut } from "../sign-out";
import { SupportForm } from "../support-form";
import { ThemeSwitch } from "../theme-switch";

export function OnboardingUserMenu() {
  const { data: user } = useUserQuery();
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
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
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate line-clamp-1 max-w-[155px] block text-xs">
                {user?.fullName}
              </span>
              <span className="truncate text-xs text-[#606060] font-normal">
                {user?.email}
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-xs"
            onSelect={() => setSupportOpen(true)}
          >
            Support
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="flex flex-row justify-between items-center p-2">
            <p className="text-xs">Theme</p>
            <ThemeSwitch />
          </div>

          <DropdownMenuSeparator />

          <SignOut />
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="sm:max-w-[525px] !p-8">
          <DialogHeader className="mb-6">
            <DialogTitle>Support</DialogTitle>
          </DialogHeader>
          <SupportForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
