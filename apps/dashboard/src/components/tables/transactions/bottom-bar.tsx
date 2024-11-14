"use client";

import { useI18n } from "@/locales/client";
import { useUserContext } from "@/store/user/hook";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  count: number;
  show: boolean;
  totalAmount?: {
    amount: number;
    currency: string;
  }[];
};

export function BottomBar({ count, show, totalAmount }: Props) {
  const { locale } = useUserContext((state) => state.data);
  const multiCurrency = totalAmount && totalAmount.length > 1;
  const t = useI18n();
  const first = totalAmount && totalAmount.at(0);

  const amountPerCurrency =
    totalAmount &&
    totalAmount
      .map((total) =>
        formatAmount({
          amount: total?.amount,
          currency: total.currency,
          locale,
        }),
      )
      .join(", ");

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed bottom-2 left-0 right-0 pointer-events-none flex justify-center"
        animate={{ y: show ? 0 : 100 }}
        initial={{ y: 100 }}
      >
        <div className="pointer-events-auto backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-full space-x-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="flex items-center space-x-2">
                <Icons.Info className="text-[#606060]" />
                <span className="text-sm">
                  {multiCurrency
                    ? t("bottom_bar.multi_currency")
                    : first &&
                      formatAmount({
                        amount: first?.amount,
                        currency: first?.currency,
                        locale,
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0,
                      })}
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={30} className="px-3 py-1.5 text-xs">
                {multiCurrency
                  ? amountPerCurrency
                  : t("bottom_bar.description")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-sm text-[#878787]">
            ({t("bottom_bar.transactions", { count })})
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
