"use client";

import { useTrackerStore } from "@/store/tracker";
import { Button } from "@absplatform/ui/button";
import { Icons } from "@absplatform/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

export function TrackerControl() {
  const { setTracking, isTracking } = useTrackerStore();
  const defaultTitle = useRef("");

  useEffect(() => {
    if (isTracking) {
      defaultTitle.current = document?.title;
      document.title = `Tracking (08:35h)`;
    } else {
      if (defaultTitle.current) {
        document.title = defaultTitle.current;
      }
    }
  }, [isTracking]);

  return (
    <AnimatePresence>
      {isTracking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Button
            variant="outline"
            className="rounded-full flex space-x-2 items-center"
            onClick={() => setTracking()}
          >
            <Icons.Pause className="text-[#FF3638]" />
            <span>08:35h</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
