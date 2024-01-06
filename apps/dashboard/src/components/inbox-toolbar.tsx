"use client";

import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function InboxToolbar({ item }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 550);
  }, [item]);

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed bottom-14 right-[215px] z-50 w-[380px]"
        animate={{ y: show ? 0 : 150 }}
        initial={{ y: 150 }}
      >
        <div className="backdrop-filter backdrop-blur-lg flex h-12 dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 justify-between items-center flex px-4 border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-lg">
          <div>
            <div className="flex items-center">
              {item.status === "completed" ? (
                <Icons.Check className="w-[22px] h-[22px]" />
              ) : (
                <Icons.Search className="w-[22px] h-[22px]" />
              )}
              <Input
                placeholder="Select transaction"
                className="w-full border-0"
                value={
                  item.status === "completed"
                    ? "Google • €15.60 • Nov 1"
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
