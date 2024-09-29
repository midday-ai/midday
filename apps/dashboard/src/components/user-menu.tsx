import { createStripePortal } from "@midday/stripe";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
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
import Image from "next/image";
import Link from "next/link";
import { SignOut } from "./sign-out";
import { ThemeSwitch } from "./theme-switch";
/**
 * UserMenu component
 * 
 * This component renders a dropdown menu for the user, containing various
 * account-related options and actions.
 * 
 * @param {Object} props - The component props
 * @param {boolean} props.onlySignOut - If true, only the sign-out option will be displayed
 * 
 * @returns {Promise<React.ReactElement>} A Promise that resolves to a React element
 */
export async function UserMenu({ onlySignOut }: { onlySignOut: boolean }): Promise<React.ReactElement> {
  const supabaseClient = createClient();
  const { data: userData } = await getUser();

  // Query portal URL for Stripe customer portal
  const portalUrl = await createStripePortal('/account', supabaseClient);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-full w-8 h-8 cursor-pointer">
          {userData?.avatar_url && (
            <Image
              src={userData.avatar_url}
              alt={userData.full_name || 'User avatar'}
              width={32}
              height={32}
            />
          )}
          <AvatarFallback>
            <span className="text-xs">
              {userData?.full_name?.charAt(0)?.toUpperCase() || 'U'}
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
                  <span className="truncate line-clamp-1 max-w-[155px] block">
                    {userData?.full_name}
                  </span>
                  <span className="truncate text-xs text-[#606060] font-normal">
                    {userData.email}
                  </span>
                </div>
                <div className="border py-0.5 px-3 rounded-full text-[11px] font-normal">
                  Beta
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link prefetch href="/account">
                <DropdownMenuItem>
                  Account
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>

              <Link prefetch href="/account/support">
                <DropdownMenuItem>Support</DropdownMenuItem>
              </Link>

              <Link prefetch href="/account/teams">
                <DropdownMenuItem>
                  Teams
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>

              <Link prefetch href={portalUrl}>
                <DropdownMenuItem>
                  Manage Subscriptions
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <div className="flex flex-row justify-between items-center p-2">
              <p className="text-sm">Theme</p>
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
