import { getSession } from "@midday/supabase/server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import Image from "next/image";
import { SignOut } from "./sign-out";

export async function UserMenu() {
  const { user } = await getSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Image
          src={user?.user_metadata?.avatar_url}
          width={32}
          height={32}
          className="rounded-full w-8 h-8"
          alt={user.full_name}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" sideOffset={10} align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SignOut />
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
