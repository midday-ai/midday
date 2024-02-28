"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SelectTransaction } from "./select-transaction";

export function InboxToolbar({ item, teamId, onSelect, isLoaded }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setShow(true);
    }
  }, [isLoaded]);

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed bottom-14 right-[160px] z-50 w-[400px]"
        animate={{ y: show ? 0 : 150 }}
        initial={{ y: 150 }}
      >
        <div className="backdrop-filter backdrop-blur-lg h-12 dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 justify-between items-center flex border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-lg">
          <SelectTransaction
            placeholder="Select transaction"
            teamId={teamId}
            inboxId={item.id}
            selectedTransaction={item?.transaction}
            onSelect={onSelect}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
