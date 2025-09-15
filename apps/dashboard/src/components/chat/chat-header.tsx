"use client";

import { ChatHistory } from "@/components/chat/chat-history";
import { NewChat } from "@/components/chat/new-chat";
import { OverviewCustomize } from "@/components/overview/overview-customize";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OverviewHeader } from "../overview/overview-header";

export function ChatHeader() {
  const router = useRouter();
  const [showTitle, setShowTitle] = useState(false);

  const pathname = usePathname();

  const isOnRootPath = pathname === "/" || pathname === "";

  // useEffect(() => {
  //   if (!title) {
  //     setShowTitle(false);
  //     return;
  //   }

  //   setShowTitle(true);
  // }, [title]);

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-background py-6">
      {isOnRootPath && <OverviewHeader />}

      {/* Left section - back button stays in place */}
      <div className="absolute left-4 top-6 flex items-center">
        {!isOnRootPath && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
          >
            <Icons.ArrowBack size={16} />
          </Button>
        )}
      </div>

      {/* Center section - title centered in available space */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-300 ease-in-out",
          // hasCanvas ? "mr-[604px]" : "", // Account for canvas width + margin when centering
        )}
        style={{
          marginLeft: !isOnRootPath ? "64px" : "16px", // Account for back button width
        }}
      >
        {/* {title ? (
          <h1
            className={`text-primary text-sm font-regular truncate transition-all duration-150 ease-out transform ${
              showTitle
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3"
            }`}
          >
            {title.split("").map((char, index) => {
              const centerIndex = Math.floor(title.length / 2);
              const distanceFromCenter = Math.abs(index - centerIndex);
              const delay = distanceFromCenter * 3 + 20;

              return (
                <span
                  key={`${title}-${index}-${char}`}
                  className={`inline-block transform transition-all duration-100 ${
                    showTitle
                      ? "opacity-100 translate-y-0 rotate-0"
                      : "opacity-0 translate-y-2 -rotate-12"
                  }`}
                  style={{
                    transitionDelay: `${delay}ms`,
                    transitionTimingFunction:
                      "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              );
            })}
          </h1>
        ) : (
          <div />
        )} */}
      </div>

      {/* Right section - positioned relative to canvas edge */}
      <div
        className={cn(
          "absolute top-6 flex items-center space-x-4 transition-all duration-300 ease-in-out",
          // hasCanvas
          //   ? "right-[634px]" // 600px canvas width + 4px margin
          //   : "right-4", // Normal right margin when no canvas
        )}
      >
        <NewChat />
        <OverviewCustomize />
        <ChatHistory />
      </div>
    </div>
  );
}
