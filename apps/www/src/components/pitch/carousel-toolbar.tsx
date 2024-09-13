"use client";

import { Button } from "@midday/ui/button";
import { useCarousel } from "@midday/ui/carousel";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { FaXTwitter } from "react-icons/fa6";

import { CopyInput } from "../copy-input";

type Props = {
  views: number;
};

const popupCenter = ({ url, title, w, h }) => {
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;

  const systemZoom = width / window.screen.availWidth;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    `
    scrollbars=yes,
    width=${w / systemZoom}, 
    height=${h / systemZoom}, 
    top=${top}, 
    left=${left}
    `,
  );

  return newWindow;
};

export function CarouselToolbar({ views }: Props) {
  const api = useCarousel();

  useHotkeys("arrowRight", () => api.scrollNext(), [api]);
  useHotkeys("arrowLeft", () => api.scrollPrev(), [api]);

  const handleOnShare = () => {
    const popup = popupCenter({
      url: "https://twitter.com/intent/tweet?text=Check this pitch deck https://solomon-ai.app/pitch @middayai",
      title: "Share",
      w: 800,
      h: 400,
    });

    popup?.focus();
  };

  return (
    <Dialog>
      <div className="fixed bottom-5 left-0 flex w-full justify-center">
        <AnimatePresence>
          <motion.div animate={{ y: views > 0 ? 0 : 100 }} initial={{ y: 100 }}>
            <TooltipProvider delayDuration={20}>
              <div className="flex h-10 items-center space-x-4 border border-[#2C2C2C] bg-[#1A1A1A]/80 px-4 py-2 backdrop-blur-lg backdrop-filter">
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center space-x-2 border-r-[1px] border-border pr-4 text-[#878787]">
                      <Icons.Visibility size={18} />

                      <span className="text-sm">
                        {Intl.NumberFormat("en", {
                          notation: "compact",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 1,
                        }).format(views ?? 0)}
                      </span>
                    </div>
                  </TooltipTrigger>

                  <TooltipContent
                    className="rounded-sm px-3 py-1"
                    sideOffset={25}
                  >
                    <span className="text-xs">Views</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" onClick={() => api.scrollTo(100)}>
                      <Icons.Calendar size={18} className="text-[#878787]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="rounded-sm px-3 py-1"
                    sideOffset={25}
                  >
                    <span className="text-xs">Book a meeting</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <DialogTrigger asChild>
                      <Icons.Share
                        size={18}
                        className="-mt-[1px] text-[#878787]"
                      />
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    className="rounded-sm px-3 py-1"
                    sideOffset={25}
                  >
                    <span className="text-xs">Share</span>
                  </TooltipContent>
                </Tooltip>

                <div className="flex items-center border-l-[1px] border-border pl-4">
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
                      className="rounded-sm px-3 py-1"
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
                      className="rounded-sm px-3 py-1"
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

      <DialogContent className="sm:max-w-[425px]">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Thanks for sharing our pitch deck.
          </DialogDescription>

          <div className="grid gap-6 py-4">
            <CopyInput value="https://solomon-ai.app/pitch" />
            <Button
              className="flex h-10 w-full items-center space-x-2"
              onClick={handleOnShare}
            >
              <span>Share on</span>
              <FaXTwitter />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
