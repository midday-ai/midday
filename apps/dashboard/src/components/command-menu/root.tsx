"use client";

import { signOutAction } from "@/actions/sign-out-action";
import { useCommandStore } from "@/store/command";
import { useMenuStore } from "@/store/menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@midday/ui/command";
import { Icons } from "@midday/ui/icons";
import { DialogProps } from "@radix-ui/react-alert-dialog";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

const navigation = [
  {
    name: "Overview",
    path: "/",
    icon: Icons.Overview,
  },
  {
    name: "Inbox",
    path: "/inbox",
    icon: Icons.Inbox2,
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: () => <Icons.Transactions size={20} />,
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: Icons.Invoice,
  },
  {
    name: "Tracker",
    path: "/tracker",
    icon: Icons.Tracker,
  },
  {
    name: "Vault",
    path: "/vault",
    icon: Icons.Files,
  },
  {
    name: "Exports",
    path: "/vault/exports",
    icon: Icons.DriveFileMove,
  },
  {
    name: "Apps",
    path: "/apps",
    icon: Icons.Apps,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Icons.Settings,
  },
];

const settings = [
  {
    name: "Account",
    path: "/account",
    icon: Icons.Person,
  },
  {
    name: "Team",
    path: "/account/teams",
    icon: Icons.Peolple,
  },
  {
    name: "Security",
    path: "/account/security",
    icon: Icons.Security,
  },
  {
    name: "Notifications",
    path: "/settings/notifications",
    icon: Icons.Notifications,
  },
  {
    name: "Bank Accounts",
    path: "/settings/connected",
    icon: Icons.AccountBalance,
  },
];

export function CommandRoot() {
  const { toggleCustomizing } = useMenuStore();
  const { setTheme } = useTheme();
  const { isOpen, setOpen } = useCommandStore();
  const router = useRouter();

  const runCommand = (command: () => unknown) => {
    setOpen();
    command();
  };

  const handleSignOut = async () => {
    signOutAction();
    router.refresh();
  };

  return (
    <>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigation.map(({ path, icon: Icon, name }) => (
            <CommandItem
              key={path}
              onSelect={() => {
                router.push(path);
                setOpen();
              }}
            >
              <div className="flex space-x-2">
                <Icon className="h-4 w-4" />
                <span>{name}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {settings.map(({ path, icon: Icon, name }) => (
            <CommandItem
              key={path}
              onSelect={() => {
                router.push(path);
                setOpen();
              }}
            >
              <div className="flex space-x-2">
                <Icon className="h-4 w-4" />
                <span>{name}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => runCommand(() => toggleCustomizing())}>
            <Icons.DashboardCustomize className="mr-2 h-4 w-4" />
            Customize menu
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <SunIcon className="mr-2 h-4 w-4" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <MoonIcon className="mr-2 h-4 w-4" />
            Dark
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  );
}
