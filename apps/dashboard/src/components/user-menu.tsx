import { getSupabaseServerClient } from "@midday/supabase/server-client";
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
import Link from "next/link";
import { SignOut } from "./sign-out";

export async function UserMenu() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Image
          src={data.session.user.user_metadata.avatar_url}
          width={32}
          height={32}
          className="rounded-full w-8 h-8"
          alt={data.full_name}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" sideOffset={10} align="end">
        <DropdownMenuGroup>
          <Link href="/settings/profile">
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/onboarding">
            <DropdownMenuItem>
              Onboarding
              <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
