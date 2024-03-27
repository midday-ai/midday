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
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  views: number;
};

export function CarouselToolbar({ views }: Props) {
  const api = useCarousel();

  useHotkeys("arrowRight", () => api.scrollNext(), [api]);
  useHotkeys("arrowLeft", () => api.scrollPrev(), [api]);

  return (
    <div className="fixed flex justify-center left-0 bottom-5 w-full">
      <AnimatePresence>
        <motion.div animate={{ y: views > 0 ? 0 : 100 }} initial={{ y: 100 }}>
          <TooltipProvider delayDuration={20}>
            <div className="flex backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 h-10 px-4 py-2 border border-[#2C2C2C] items-center rounded-2xl space-x-4">
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-[#878787] flex items-center space-x-2 border-r-[1px] border-border pr-4">
                    <Icons.Visibility size={18} />

                    <span className="text-sm">
                      {Intl.NumberFormat("en", { notation: "compact" }).format(
                        views ?? 0
                      )}
                    </span>
                  </div>
                </TooltipTrigger>

                <TooltipContent
                  className="py-1 px-3 rounded-sm"
                  sideOffset={25}
                >
                  <span className="text-xs">Views</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => api.scrollTo(100)}>
                    <Icons.Calendar size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className="py-1 px-3 rounded-sm"
                  sideOffset={25}
                >
                  <span className="text-xs">Book a meeting</span>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent
                    className="py-1 px-3 rounded-sm"
                    sideOffset={25}
                  >
                    <span className="text-xs">Previous slide</span>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent
                    className="py-1 px-3 rounded-sm"
                    sideOffset={25}
                  >
                    <span className="text-xs">Next slide</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
