"use client";

import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type SavingBarStatus = "idle" | "saving" | "saved";

interface SavingBarProps {
  /** Pass `true` when a save is in progress */
  isPending: boolean;
}

export function SavingBar({ isPending }: SavingBarProps) {
  const [status, setStatus] = useState<SavingBarStatus>("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
      setStatus("saving");
      if (timeout.current !== null) clearTimeout(timeout.current);
    } else if (wasPending.current) {
      wasPending.current = false;
      setStatus("saved");
      if (timeout.current !== null) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setStatus("idle"), 1500);
    }
  }, [isPending]);

  return (
    <AnimatePresence>
      {status !== "idle" && (
        <motion.div
          className="sticky bottom-1 flex justify-center pointer-events-none z-10 -mt-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="h-9 px-4 flex items-center gap-2 pointer-events-auto backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] border border-border rounded-full">
            {status === "saving" ? (
              <>
                <Spinner size={14} />
                <span className="text-xs">Saving...</span>
              </>
            ) : (
              <>
                <Icons.Check className="size-3.5" />
                <span className="text-xs">Saved</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
