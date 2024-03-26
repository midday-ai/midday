"use client";

import { useCurrentLocale } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

export function BottomBar({ count, show, totalAmount, currency }) {
  const locale = useCurrentLocale();

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed bottom-2 left-64 right-4 -ml-4"
        animate={{ y: show ? 0 : 100 }}
        initial={{ y: 100 }}
      >
        <div className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-lg">
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
                locale,
              })}
            </span>
          </div>

          <div>
            <span className="text-sm">{count} Transactions</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
