"use client";

import { useAssistantStore } from "@/store/assistant";
import { Button } from "@midday/ui/button";

export function AssistantButton() {
  const { setOpen } = useAssistantStore();

  return (
    <Button
      variant="outline"
      className="relative min-w-[250px] w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 border-0 p-0 hover:bg-transparent font-normal no-drag"
      onClick={() => setOpen()}
    >
      <span className="ml-4 md:ml-0">Ask Midday a question...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 border bg-accent px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
