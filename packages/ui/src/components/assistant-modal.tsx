"use client";

import { forwardRef, type FC } from "react";
import { Thread } from "./thread";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "../utils/cn";
import { AssistantModalPrimitive } from "@assistant-ui/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { BotIcon, ChevronDownIcon } from "lucide-react";

export const AssistantModal: FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <AssistantModalPrimitive.Root>
      <AssistantModalPrimitive.Anchor
        className={cn("fixed bottom-4 right-4 size-12", className)}
      >
        <AssistantModalPrimitive.Trigger asChild>
          <FloatingAssistantButton />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        sideOffset={16}
        className={
          "z-50 h-[500px] w-[400px] rounded-xl border border-zinc-200 bg-white p-0 text-zinc-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out data-[state=open]:zoom-in data-[state=closed]:slide-out-to-bottom-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-right-1/2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        }
      >
        <Thread />
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

type FloatingAssistantButtonProps = { "data-state"?: "open" | "closed" };

const FloatingAssistantButton = forwardRef<
  HTMLButtonElement,
  FloatingAssistantButtonProps
>(({ "data-state": state, ...rest }, ref) => {
  const tooltip = state === "open" ? "Close Assistant" : "Open Assistant";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="icon"
            {...rest}
            className="size-full rounded-full shadow transition-transform hover:scale-110 active:scale-90"
            ref={ref}
          >
            <BotIcon
              className={cn(
                "absolute size-6 transition-all",
                state === "open" && "rotate-90 scale-0",
                state === "closed" && "rotate-0 scale-100",
              )}
            />

            <ChevronDownIcon
              className={cn(
                "absolute size-6 transition-all",
                state === "open" && "rotate-0 scale-100",
                state === "closed" && "-rotate-90 scale-0",
              )}
            />
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

FloatingAssistantButton.displayName = "FloatingAssistantButton";
