"use client";

import { trackingConsentAction } from "@/actions/tracking-consent-action";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

export function ConsentBanner() {
  const [isOpen, setOpen] = useState(true);
  const trackingAction = useAction(trackingConsentAction, {
    onExecute: () => setOpen(false),
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-50 bottom-2 md:bottom-4 left-2 md:left-4 flex flex-col space-y-4 w-[calc(100vw-16px)] max-w-[420px] border border-border p-4 transition-all bg-background",
        isOpen &&
          "animate-in sm:slide-in-from-bottom-full slide-in-from-bottom-full",
      )}
    >
      <div className="text-sm">
        This site uses tracking technologies. You may opt in or opt out of the
        use of these technologies.
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          className="rounded-full h-8"
          onClick={() => trackingAction.execute(false)}
        >
          Deny
        </Button>
        <Button
          className="rounded-full h-8"
          onClick={() => trackingAction.execute(true)}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
