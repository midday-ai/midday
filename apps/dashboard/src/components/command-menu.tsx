"use client";

import { signOutAction } from "@/actions/sign-out-action";
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
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const navigation = [
  {
    name: "Overview",
    path: "/",
    icon: Icons.Overview,
  },
  {
    name: "Inbound",
    path: "/inbound",
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
    name: "Timer",
    path: "/timer",
    icon: Icons.Timer,
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
    name: "Security",
    path: "/settings/security",
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

export function CommandMenu({ ...props }: DialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    signOutAction();
    router.refresh();
  };

  useHotkeys("ctrl+k", () => setOpen((open) => !open));
  useHotkeys("meta+k", () => setOpen((open) => !open));

  useHotkeys("meta+o", (evt) => {
    evt.preventDefault();
    router.push("/onboarding");
  });

  useHotkeys("ctrl+o", (evt) => {
    evt.preventDefault();
    router.push("/onboarding");
  });

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    router.push("/settings");
  });

  useHotkeys("ctrl+s", (evt) => {
    evt.preventDefault();
    router.push("/settings");
  });

  useHotkeys("ctrl+meta+p", (evt) => {
    evt.preventDefault();
    router.push("/profile");
  });

  useHotkeys("shift+meta+p", (evt) => {
    evt.preventDefault();
    router.push("/profile");
  });

  useHotkeys("ctrl+meta+q", (evt) => {
    evt.preventDefault();
    handleSignOut();
  });

  useHotkeys("shift+meta+q", (evt) => {
    evt.preventDefault();
    handleSignOut();
  });

  useHotkeys("ctrl+f", (evt) => {
    evt.preventDefault();
    router.push(`${pathname}?feedback`);
  });

  useHotkeys("meta+f", (evt) => {
    evt.preventDefault();
    router.push(`${pathname}?feedback`);
  });

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
