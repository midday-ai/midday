"use client";

import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
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
import { cn } from "@midday/ui/utils";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { FaXTwitter } from "react-icons/fa6";
import { CopyInput } from "./copy-input";

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
      `
  );

  return newWindow;
};

export function UpdatesToolbar({ posts }) {
  const pathname = usePathname();
  const currentIndex = posts.findIndex((a) => pathname.endsWith(a.slug)) ?? 0;
  const views = 100;

  const currentPost = posts[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      const nextPost = posts[currentIndex - 1];

      const element = document.getElementById(nextPost?.slug);
      element?.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  const handleNext = () => {
    if (currentIndex !== posts.length - 1) {
      const nextPost = posts[currentIndex + 1];

      const element = document.getElementById(nextPost?.slug);

      element?.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  useHotkeys("arrowRight", () => handleNext(), [handleNext]);
  useHotkeys("arrowLeft", () => handlePrev(), [handlePrev]);

  const handleOnShare = () => {
    const popup = popupCenter({
      url: `https://twitter.com/intent/tweet?text=${currentPost.title} https://midday.ai/updates/${currentPost.slug}`,
      title: currentPost.title,
      w: 800,
      h: 400,
    });

    popup?.focus();
  };

  return (
    <Dialog>
      <div className="fixed flex justify-center left-0 bottom-5 w-full">
        <AnimatePresence>
          <motion.div animate={{ y: views > 0 ? 0 : 100 }} initial={{ y: 100 }}>
            <TooltipProvider delayDuration={20}>
              <div className="flex backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-10 px-4 py-2 border dark:border-[#2C2C2C] border-[#DCDAD2] items-center rounded-2xl space-x-4">
                <Tooltip>
                  <TooltipTrigger>
                    <DialogTrigger asChild>
                      <Icons.Share
                        size={18}
                        className="text-[#606060] -mt-[1px]"
                      />
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    className="py-1 px-3 rounded-sm"
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
                        className={cn(currentIndex === 0 && "opacity-50")}
                        onClick={handlePrev}
                      >
                        <Icons.ChevronLeft className="h-6 w-6" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="py-1 px-3 rounded-sm"
                      sideOffset={25}
                    >
                      <span className="text-xs">Previous post</span>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          currentIndex === posts.length - 1 && "opacity-50"
                        )}
                        onClick={handleNext}
                      >
                        <Icons.ChevronRight className="h-6 w-6" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="py-1 px-3 rounded-sm"
                      sideOffset={25}
                    >
                      <span className="text-xs">Next post</span>
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

          <div className="grid gap-6 py-4">
            <CopyInput value={`https://midday.ai${pathname}`} />
            <Button
              className="w-full flex items-center space-x-2 h-10"
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
