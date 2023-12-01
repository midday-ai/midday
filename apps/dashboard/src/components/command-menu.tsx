"use client";

import { Button } from "@midday/ui/button";
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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const navigation = [
  {
    name: "Overview",
    path: "/",
    icon: Icons.Overview,
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: () => <Icons.Transactions size={20} />,
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
    name: "Profile",
    path: "/profile",
    icon: Icons.Person,
  },
  {
    name: "Team",
    path: "/settings",
    icon: Icons.Peolple,
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

export function CommandMenu({ ...props }: DialogProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 border-0 p-0 hover:bg-transparent font-normal"
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Search for or jump to</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navigation.map(({ path, icon: Icon, name }) => (
              <CommandItem
                key={path}
                onSelect={() => {
                  router.push(path);
                  setOpen(false);
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
                  setOpen(false);
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
      </CommandDialog>
    </>
  );
}
