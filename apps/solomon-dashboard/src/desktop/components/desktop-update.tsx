"use client";

import { cn } from "@midday/ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { todesktopUpdater } from "@todesktop/client-core";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function DesktopUpdate() {
  if (!isDesktopApp()) {
    return null;
  }

  const [status, setStatus] = useState<
    "update-available" | "update-downloaded"
  >();

  useEffect(() => {
    todesktopUpdater.on("update-available", () => {
      setStatus("update-available");
    });

    todesktopUpdater.on("update-downloaded", () => {
      setStatus("update-downloaded");
    });
  }, []);

  const handleOnClick = async () => {
    if (status === "update-available") {
      // Note: Should we handle download binary here?
    }

    if (status === "update-downloaded") {
      setStatus(null);
      todesktopUpdater.restartAndInstall();
    }
  };

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <TooltipProvider delayDuration={50}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-[11px] h-[11px] bg-[#7aafd3] rounded-full flex items-center justify-center invisible todesktop:visible">
                  <button
                    className={cn("update-available", status)}
                    type="button"
                    onClick={handleOnClick}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 3.25V8.75M6 8.75L8.25 6.5M6 8.75L3.75 6.5"
                        stroke="#294771"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        className="svg-update"
                      />
                      <circle
                        cx="6"
                        cy="6"
                        r="2.25"
                        stroke="#294771"
                        stroke-width="4.5"
                        className="svg-progress"
                      />
                      <path
                        d="M3.75 6C3.75 4.75736 4.75736 3.75 6 3.75C6.39468 3.75 6.71356 3.83142 7.00573 3.99422L6.42675 4.5732C6.26926 4.73069 6.3808 4.99997 6.60353 4.99997H8.74998C8.88805 4.99997 8.99998 4.88805 8.99998 4.74997V2.60353C8.99998 2.3808 8.73069 2.26926 8.5732 2.42675L8.09023 2.90972C7.51041 2.49373 6.83971 2.25 6 2.25C3.92893 2.25 2.25 3.92893 2.25 6C2.25 8.07107 3.92893 9.75 6 9.75C7.63395 9.75 9.02199 8.70541 9.53642 7.24993C9.67446 6.8594 9.46977 6.4309 9.07923 6.29287C8.68869 6.15483 8.2602 6.35953 8.12216 6.75007C7.81293 7.62497 6.97849 8.25 6 8.25C4.75736 8.25 3.75 7.24264 3.75 6Z"
                        fill="#294771"
                        className="svg-refresh"
                      />
                    </svg>
                  </button>
                </div>
              </TooltipTrigger>

              <TooltipContent sideOffset={10} className="text-xs p-2">
                {status === "update-available" && "Update Available"}
                {status === "update-downloaded" && "Relaunch to Update"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
