"use client";

import { ChatHistory } from "@/components/chat/chat-history";
import { NewChat } from "@/components/chat/new-chat";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";

export function ChatHeader({ title }: { title?: string | null }) {
  const router = useRouter();

  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    if (title) {
      setShowTitle(true);
    }
  }, [title]);

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-background py-6 w-full flex justify-between">
      {/* Left section - back button stays in place */}
      <div className="flex items-center">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <Icons.ArrowBack size={16} />
        </Button>
      </div>

      {/* Center section - title centered in available space */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-300 ease-in-out",
        )}
      >
        <h1
          className={`text-primary text-sm font-regular truncate transition-all duration-150 ease-out transform ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {title?.split("").map((char, index) => {
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
      </div>

      {/* Right section - positioned relative to canvas edge */}
      <div
        className={cn(
          "flex items-center space-x-4 transition-all duration-300 ease-in-out",
        )}
      >
        <NewChat />
        <ChatHistory />
      </div>
    </div>
  );
}
