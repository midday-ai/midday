"use client";

import { useDocumentsStore } from "@/store/vault";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";

export function BottomBar() {
  const { rowSelection } = useDocumentsStore();

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed bottom-4 left-0 right-0 pointer-events-none flex justify-center"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="pointer-events-auto backdrop-filter min-w-[500px] backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C] border-[#DCDAD2]">
          <span className="text-sm text-[#878787]">
            <NumberFlow value={Object.keys(rowSelection).length} /> selected
          </span>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" className="space-x-1">
              <span>More actions</span>
              <Icons.ChevronDown className="size-4" />
            </Button>

            <Button>
              <span>Download</span>
              <Icons.ArrowCoolDown className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
