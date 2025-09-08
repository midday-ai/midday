"use client";

import { ChatHistory } from "@/components/chat/chat-history";
import { NewChat } from "@/components/chat/new-chat";
import { OverviewCustomize } from "@/components/overview/overview-customize";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  title?: string;
  hasCanvas?: boolean;
};

export function ChatHeader({ title, hasCanvas }: Props) {
  const router = useRouter();
  const [showTitle, setShowTitle] = useState(false);

  const pathname = usePathname();

  const isOnRootPath = pathname === "/" || pathname === "";

  useEffect(() => {
    if (!title) {
      setShowTitle(false);
      return;
    }

    // Reset first, then trigger animation
    setShowTitle(false);
    const timeout = setTimeout(() => {
      setShowTitle(true);
    }, 30);

    return () => clearTimeout(timeout);
  }, [title]);

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-background py-6">
      <div
        className={cn(
          "flex items-center justify-between transition-all duration-300 ease-in-out",
          hasCanvas
            ? "px-6 mx-auto max-w-[770px] w-full -translate-x-[300px]" // Constrained and slide left when canvas open
            : "px-6 w-full translate-x-0", // Full width when canvas closed
        )}
      >
        {!isOnRootPath && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
          >
            <Icons.ArrowBack size={16} />
          </Button>
        )}

        {title ? (
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
          <div className="h-5" />
        )}

        <div className="flex items-center space-x-4">
          <NewChat />
          <OverviewCustomize />
          <ChatHistory />
        </div>
      </div>
    </div>
  );
}
