"use client";

import { Pagination } from "@/components/pagination";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

export function BottomBar({
  from,
  to,
  page,
  count,
  show,
  totalAmount,
  hasNextPage,
  currency,
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed bottom-2 left-64 right-4 -ml-4"
        animate={{ y: show ? 0 : 100 }}
        initial={{ y: 100 }}
      >
        <div className="backdrop-filter backdrop-blur-lg flex h-12 bg-[#1A1A1A]/80 justify-between items-center flex px-4 border border-[#2C2C2C] rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Total</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Icons.Info className="text-[#606060]" />
                </TooltipTrigger>
                <TooltipContent sideOffset={30}>
                  <p>Includes transactions from all pages of results.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            <span className="text-sm font-medium">
              {formatAmount({
                amount: totalAmount,
                currency,
              })}
            </span>
          </div>
          <div>
            <Pagination
              page={page}
              count={count}
              from={from}
              to={to}
              hasNextPage={hasNextPage}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
