"use client";

import { useAssistantStore } from "@/store/assistant";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";

export function InsightInput() {
  const { setOpen } = useAssistantStore();

  return (
    <div>
      <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8">
        <div className="relative z-20">
          <Input
            placeholder="Ask Midday a question..."
            className="w-full h-11 cursor-pointer bg-background"
            onFocus={() => setOpen()}
          />
          <Icons.LogoIcon className="absolute right-3 bottom-3.5 pointer-events-none" />
        </div>
      </div>
      <div className="absolute h-[76px] bg-gradient-to-t from-background to-[#fff]/70 dark:to-[#121212]/90 bottom-0 left-0 right-0 w-full z-10" />
    </div>
  );
}
