"use client";

import { MenuOption, useCommandStore } from "@/store/command";
import { CommandDialog } from "@midday/ui/command";
import { DialogProps } from "@radix-ui/react-alert-dialog";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { CommandNavigation } from "./navigation";
import { CommandTracker } from "./tracker";

const CommandComponent = ({ menu = MenuOption.Navigation }) => {
  return {
    [MenuOption.Navigation]: <CommandNavigation />,
    [MenuOption.Tracker]: <CommandTracker />,
  }[menu];
};

export function CommandMenu(props: DialogProps) {
  const { isOpen, setOpen, menu, setMenu } = useCommandStore();
  const router = useRouter();
  const pathname = usePathname();

  useHotkeys("ctrl+k", () => setOpen());
  useHotkeys("meta+k", () => setOpen());

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandComponent menu={menu} />
    </CommandDialog>
  );
}
