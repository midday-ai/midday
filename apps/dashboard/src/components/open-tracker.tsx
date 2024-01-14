"use client";

import { MenuOption, useCommandStore } from "@/store/command";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function OpenTracker() {
  const { setOpen } = useCommandStore();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setOpen(MenuOption.Tracker)}
    >
      <Icons.Add />
    </Button>
  );
}
