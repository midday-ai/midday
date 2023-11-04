import { getCachedCurrentUser } from "@midday/supabase/cached-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import Link from "next/link";
import { SignOut } from "./sign-out";
import { ThemeSwitch } from "./theme-switch";

export async function UserMenu() {
  const { data: userData } = await getCachedCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-full w-8 h-8">
          <AvatarImage src={userData?.avatar_url} />
          <AvatarFallback>
            <span className="text-xs">{userData?.full_name?.charAt(0)}</span>
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" sideOffset={10} align="end">
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>

          <Link href="/settings">
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>

          <Link href="/onboarding">
            <DropdownMenuItem>
              Onboarding
              <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex flex-row justify-between items-center p-2">
          <p className="text-sm">Theme</p>
          <ThemeSwitch />
        </div>
        <DropdownMenuSeparator />
        <SignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
