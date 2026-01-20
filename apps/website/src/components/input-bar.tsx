"use client";

import { cn } from "@midday/ui/cn";
import { Input } from "@midday/ui/input";
import type { RefObject } from "react";

interface InputBarProps {
  isLightMode: boolean;
  inputRef: RefObject<HTMLInputElement>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
}

export function InputBar({
  isLightMode,
  inputRef,
  searchQuery,
  setSearchQuery,
  placeholder = "Ask anything",
}: InputBarProps) {
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground",
          "text-[12px] px-3 py-2",
        )}
      />
    </div>
  );
}
