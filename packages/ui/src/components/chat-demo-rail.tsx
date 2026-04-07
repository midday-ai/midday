"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";
import type { ChatDemoScenario } from "./animations/chat-demo-animation";
import { Icons } from "./icons";

export type { ChatDemoScenario };

const DEMO_STORIES: {
  id: ChatDemoScenario;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "reminder", label: "Push notification", icon: Icons.Notifications },
  { id: "create-invoice", label: "Create invoice", icon: Icons.Invoice },
  { id: "receipt-match", label: "Receipt match", icon: Icons.ReceiptLong },
  {
    id: "latest-transactions",
    label: "Latest transactions",
    icon: Icons.Transactions,
  },
];

export { DEMO_STORIES };

export function ChatDemoRail({
  activeScenario,
  onSelect,
  className,
  size = "default",
}: {
  activeScenario: ChatDemoScenario;
  onSelect: (scenario: ChatDemoScenario) => void;
  className?: string;
  size?: "default" | "sm";
}) {
  const isSmall = size === "sm";

  return (
    <motion.div
      className={className}
      initial={{ y: 18, opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 24,
        mass: 0.95,
      }}
    >
      <div
        className={`pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center overflow-x-auto border border-black/5 bg-[rgba(247,247,247,0.98)] backdrop-blur-[18px] dark:border-white/8 dark:bg-[rgba(19,19,19,0.98)] ${
          isSmall ? "gap-0 p-0.5" : "gap-1 p-1 sm:gap-1 sm:p-1.5"
        }`}
      >
        {DEMO_STORIES.map((story) => {
          const Icon = story.icon;
          const isActive = activeScenario === story.id;

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => onSelect(story.id)}
              className={`flex shrink-0 items-center transition-colors ${
                isSmall
                  ? "gap-1.5 px-2 py-1 font-sans text-xs"
                  : "gap-2 px-2.5 py-1.5 font-sans text-sm sm:px-3 sm:py-1.5"
              } ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={isSmall ? "size-3" : "size-4"} />
              <span className="whitespace-nowrap font-medium">
                {story.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
