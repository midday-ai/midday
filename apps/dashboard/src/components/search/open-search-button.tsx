"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useForesightSearchPrefetch } from "@/hooks/use-foresight-prefetch";
import { useSearchStore } from "@/store/search";

export function OpenSearchButton() {
  const { setOpen } = useSearchStore();
  const { elementRef: searchButtonRef } = useForesightSearchPrefetch();

  return (
    <Button
      ref={searchButtonRef}
      variant="outline"
      className="relative min-w-[250px] w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 border-0 p-0 hover:bg-transparent font-normal no-drag hidden md:flex"
      onClick={() => setOpen()}
    >
      <Icons.Search size={18} className="mr-2" />
      <span>Find anything...</span>
      <kbd className="pointer-events-none absolute opacity-0 hover:opacity-100 right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 border bg-accent px-1.5 text-[10px] font-medium sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
