"use client";

import { usePathname } from "next/navigation";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
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
      `,
  );

  return newWindow;
};

export function UpdatesToolbar({ posts }) {
  const pathname = usePathname();
  const currentIndex = posts.findIndex((a) => pathname.endsWith(a.slug)) ?? 0;

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
      url: `https://twitter.com/intent/tweet?text=${currentPost.title} https://solomon-ai.app/updates/${currentPost.slug}`,
      title: currentPost.title,
      w: 800,
      h: 400,
    });

    popup?.focus();
  };

  return (
    <Dialog>
      <div className="fixed bottom-0 right-6 top-0 hidden flex-col items-center justify-center md:flex">
        <TooltipProvider delayDuration={20}>
          <div className="flex flex-col items-center space-y-4 rounded-full border border-[#2C2C2C] bg-[#1A1A1A]/80 p-2 backdrop-blur-lg backdrop-filter">
            <Tooltip>
              <TooltipTrigger>
                <DialogTrigger asChild>
                  <Icons.Share size={18} className="-mt-[1px] text-[#606060]" />
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent
                className="rounded-sm px-3 py-1"
                sideOffset={25}
                side="right"
              >
                <span className="text-xs">Share</span>
              </TooltipContent>
            </Tooltip>

            <div className="flex flex-col items-center space-y-2 border-t-[1px] border-border pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(currentIndex === 0 && "opacity-50")}
                    onClick={handlePrev}
                  >
                    <Icons.ChevronUp className="h-6 w-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className="rounded-sm px-3 py-1"
                  sideOffset={25}
                  side="right"
                >
                  <span className="text-xs">Previous post</span>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      currentIndex === posts.length - 1 && "opacity-50",
                    )}
                    onClick={handleNext}
                  >
                    <Icons.ChevronDown className="h-6 w-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className="rounded-sm px-3 py-1"
                  sideOffset={25}
                  side="right"
                >
                  <span className="text-xs">Next post</span>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <CopyInput value={`https://solomon-ai.app${pathname}`} />
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
