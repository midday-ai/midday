"use client";

import { useCommandStore } from "@/store/command";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function DesktopCommandMenuButton() {
  const { setOpen } = useCommandStore();

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full w-8 h-8 flex items-center invisible todesktop:visible"
      onClick={() => setOpen()}
    >
      <Icons.Search size={18} />
    </Button>
  );
}
