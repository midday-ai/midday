"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  title?: string;
};

export function ChatHeader({ title }: Props) {
  const router = useRouter();
  const [showTitle, setShowTitle] = useState(false);

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

  if (!title) return null;

  return (
    <div className="flex items-center justify-between px-8 py-6 transition-all duration-300 w-full">
      <Button variant="outline" size="icon" onClick={() => router.back()}>
        <Icons.ArrowBack size={16} />
      </Button>
      <h1
        className={`text-primary text-sm font-regular truncate transition-all duration-300 ease-out transform ${
          showTitle
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-90"
        }`}
      >
        {title.split("").map((char, index) => {
          const centerIndex = Math.floor(title.length / 2);
          const distanceFromCenter = Math.abs(index - centerIndex);
          const delay = distanceFromCenter * 10 + 50; // Much faster timing

          return (
            <span
              key={`${title}-${index}-${char}`}
              className={`inline-block transform transition-all duration-250 ${
                showTitle
                  ? "opacity-100 translate-y-0 scale-100 rotate-0"
                  : "opacity-0 translate-y-2 scale-75 -rotate-12"
              }`}
              style={{
                transitionDelay: `${delay}ms`,
                transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </h1>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon">
          <Icons.Close size={16} />
        </Button>

        <Button variant="outline" size="icon">
          <Icons.Close size={16} />
        </Button>
      </div>
    </div>
  );
}
