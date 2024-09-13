"use client";

import { useEffect, useState } from "react";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useLocalStorage } from "@uidotdev/usehooks";

export function PublicBetaBanner() {
  const [isOpen, setOpen] = useState(false);
  const [showBanner, saveShowBanner] = useLocalStorage(
    "show-public-beta-banner",
    true,
  );

  useEffect(() => {
    if (showBanner) {
      setTimeout(() => {
        setOpen(true);
      }, 3000);
    }
  }, [showBanner]);

  if (!isOpen) {
    return null;
  }

  const handleOnClose = () => {
    saveShowBanner(false);
    setOpen(false);
  };

  return (
    <a
      href="https://go.solomon-ai.app/htI3aDs"
      target="_blank"
      rel="noreferrer"
      onClick={handleOnClose}
    >
      <div
        className={cn(
          "group fixed bottom-2 left-2 z-50 h-[88px] w-[calc(100vw-16px)] max-w-[450px] rounded-2xl border border-border bg-background p-4 transition-all md:bottom-4 md:left-4",
          isOpen && "flex flex-1 gap-3 animate-in slide-in-from-bottom-full",
        )}
      >
        <div className="flex justify-between">
          <div className="flex flex-col space-y-0.5 pl-[10px] pr-8 md:border-r-[1px] md:border-border">
            <span className="text-sm font-medium">Solomon AI v1.1.0</span>
            <p className="text-xs text-[#878787]">
              Public Beta Open To All <br />
            </p>
          </div>

          <button
            onClick={handleOnClose}
            type="button"
            className="absolute left-1.5 top-1.5 hidden text-[#878787] group-hover:block"
          >
            <Icons.Close />
          </button>
          {/* 
          <div className="hidden md:block mt-1.5">
            <CountdownSmall />
          </div> */}
        </div>
      </div>
    </a>
  );
}
