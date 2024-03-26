"use client";

import { useCarousel } from "@midday/ui/carousel";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { cn } from "@midday/ui/utils";
import { AnimatePresence, motion } from "framer-motion";

export function CarouselToolbar() {
  const api = useCarousel();

  return (
    <div className="fixed flex justify-center left-0 bottom-5 w-full">
      <AnimatePresence>
        <motion.div animate={{ y: 0 }} initial={{ y: 100 }}>
          <TooltipProvider delayDuration={20}>
            <div className="flex backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 h-12 px-4 py-2 border border-[#2C2C2C] items-center rounded-full space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => api.scrollTo(100)}>
                    <Icons.Calendar size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className="py-1 px-3 rounded-sm"
                  sideOffset={25}
                >
                  <span className="text-xs">Book a meeting</span>
                </TooltipContent>
              </Tooltip>
              <button
                type="button"
                disabled={!api?.canScrollPrev}
                className={cn(!api?.canScrollPrev && "opacity-50")}
                onClick={() => {
                  api.scrollPrev();
                }}
              >
                <Icons.ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                disabled={!api?.canScrollNext}
                className={cn(!api?.canScrollNext && "opacity-50")}
                onClick={() => {
                  api.scrollNext();
                }}
              >
                <Icons.ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </TooltipProvider>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
