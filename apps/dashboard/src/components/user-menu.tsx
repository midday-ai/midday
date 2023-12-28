import { getUser } from "@midday/supabase/cached-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import Link from "next/link";
import { FeedbackModal } from "./modals/feedback-modal";
import { SignOut } from "./sign-out";
import { ThemeSwitch } from "./theme-switch";

export async function UserMenu() {
  const { data: userData } = await getUser();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="rounded-full w-8 h-8">
            <AvatarImage src={userData?.avatar_url} />
            <AvatarFallback>
              <span className="text-xs">
                {userData?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px]" sideOffset={10} align="end">
          <DropdownMenuLabel>
            <div className="flex justify-between items-center">
              <span className="truncate">{userData.full_name}</span>
              <div className="border py-0.5 px-3 rounded-full text-[11px] text-background bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000]">
                Beta
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <Link href="/profile">
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>

            <Link href="/profile/teams">
              <DropdownMenuItem>
                Teams
                <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>

            <Link href="/apps">
              <DropdownMenuItem>
                Apps
                <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuItem>
              <Link href="?feedback" className="w-full">
                Feedback
              </Link>
              <DropdownMenuShortcut>⌘F</DropdownMenuShortcut>
            </DropdownMenuItem>
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
      <FeedbackModal />
    </>
  );
}
