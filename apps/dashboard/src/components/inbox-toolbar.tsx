"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        className="h-12 absolute bottom-14 right-[215px] z-50 w-[380px]"
        animate={{ y: show ? 0 : 100 }}
        initial={{ y: 100 }}
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
          <div className="flex items-center space-x-4 justify-end">
            <span className="text-sm text-[#606060]">1/3</span>
            <div className="flex space-x-2">
              <Button
                variant="icon"
                className="p-0"
                // disabled={!page}
                // onClick={() => createPaginationQuery(page - 1)}
              >
                <ChevronLeft size={22} />
              </Button>

              <Button
                variant="icon"
                className="p-0"
                // disabled={!hasNextPage}
                // onClick={() => createPaginationQuery(page + 1)}
              >
                <ChevronRight size={22} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
