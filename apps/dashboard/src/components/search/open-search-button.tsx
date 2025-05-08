"use client";

import { useSearchStore } from "@/store/search";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function OpenSearchButton() {
  const { setOpen } = useSearchStore();

  return (
    <Button
      variant="outline"
      className="relative min-w-[250px] w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 border-0 p-0 hover:bg-transparent font-normal no-drag hidden md:flex"
      onClick={() => setOpen()}
    >
      <Icons.Search size={18} className="mr-2" />
      <span>Find anything</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 border bg-accent px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
