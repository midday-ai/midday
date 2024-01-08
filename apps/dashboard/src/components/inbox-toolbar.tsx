"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SelectTransaction } from "./select-transaction";

export function InboxToolbar({ item, teamId, latestTransactions }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 550);
  }, [item]);

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed bottom-14 right-[200px] z-50 w-[400px]"
        animate={{ y: show ? 0 : 150 }}
        initial={{ y: 150 }}
      >
        <div className="backdrop-filter backdrop-blur-lg flex h-12 dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 justify-between items-center flex border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-lg">
          <SelectTransaction
            placeholder="Select transaction"
            // onSelect={(transaction) => console.log(transaction)}
            latestTransactions={latestTransactions}
            teamId={teamId}
            selectedItem={item?.transactionId}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
