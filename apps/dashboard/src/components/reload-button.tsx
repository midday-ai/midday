"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReloadButton() {
  const router = useRouter();
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    router.refresh();
    // Reset the spinning state after a short delay
    setTimeout(() => setIsReloading(false), 1000);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8 flex items-center"
            onClick={handleReload}
            disabled={isReloading}
          >
            <Icons.Refresh
              size={16}
              className={isReloading ? "animate-spin" : ""}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          className="px-3 py-1.5 text-xs"
          sideOffset={10}
        >
          Reload
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
