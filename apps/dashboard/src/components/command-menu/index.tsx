"use client";

import { MenuOption, useCommandStore } from "@/store/command";
import { CommandDialog } from "@midday/ui/command";
import { DialogProps } from "@radix-ui/react-alert-dialog";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { CommandAI } from "./ai";
import { CommandRoot } from "./root";
import { CommandRootDesktop } from "./root-desktop";
import { CommandTracker } from "./tracker";

export const CommandComponent = ({ selected = MenuOption.Root }) => {
  const { setMenu } = useCommandStore();

  const Component = {
    [MenuOption.Root]: <CommandRoot />,
    [MenuOption.RootDesktop]: <CommandRootDesktop />,
    [MenuOption.Tracker]: <CommandTracker />,
    [MenuOption.AI]: <CommandAI />,
  }[selected];

  useHotkeys("ctrl+backspace", () => setMenu(MenuOption.RootDesktop));

  return (
    <motion.div
      className="h-full"
      key={selected}
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.98, opacity: 0 }}
    >
      {Component}
    </motion.div>
  );
};

export function CommandMenu(props: DialogProps) {
  const { isOpen, setOpen, selected, setMenu } = useCommandStore();
  const router = useRouter();
  const pathname = usePathname();

  useHotkeys("ctrl+k", () => setOpen());
  useHotkeys("meta+k", () => setOpen());

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandComponent selected={selected} />
    </CommandDialog>
  );
}
