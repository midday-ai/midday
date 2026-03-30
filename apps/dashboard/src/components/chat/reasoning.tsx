"use client";

import { cn } from "@midday/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import { Icons } from "@midday/ui/icons";
import { TextShimmer } from "@midday/ui/text-shimmer";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ICON_SIZE, STATUS_ROW } from "./chat-utils";

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  duration: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export function useReasoning() {
  const ctx = useContext(ReasoningContext);
  if (!ctx) throw new Error("useReasoning must be used within <Reasoning>");
  return ctx;
}

export function Reasoning({
  isStreaming,
  children,
}: {
  isStreaming: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [duration, setDuration] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStreaming) {
      if (startRef.current === null) {
        startRef.current = Date.now();
      }
    } else if (startRef.current !== null) {
      setDuration(Math.round((Date.now() - startRef.current) / 1000));
    }
  }, [isStreaming]);

  return (
    <ReasoningContext.Provider
      value={{ isStreaming, isOpen, setIsOpen, duration }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
}

export function ReasoningTrigger() {
  const { isStreaming, isOpen, duration } = useReasoning();

  return (
    <CollapsibleTrigger
      className={cn(
        STATUS_ROW,
        "text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer",
      )}
    >
      <Icons.ChevronRight
        size={ICON_SIZE}
        className={cn(
          "transition-transform duration-150",
          isOpen && "rotate-90",
        )}
      />
      {isStreaming ? (
        <TextShimmer className="text-xs font-normal" duration={0.75}>
          Thinking...
        </TextShimmer>
      ) : (
        <span>Thought for {Math.max(duration, 1)}s</span>
      )}
    </CollapsibleTrigger>
  );
}

export function ReasoningContent({ children }: { children: string }) {
  if (!children) return null;

  return (
    <CollapsibleContent>
      <div className="mt-1.5 ml-0.5">
        <p className="text-xs text-muted-foreground/50 leading-relaxed whitespace-pre-wrap">
          {children}
        </p>
      </div>
    </CollapsibleContent>
  );
}
