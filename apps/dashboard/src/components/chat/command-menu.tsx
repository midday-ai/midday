"use client";

import type { CommandSuggestion } from "@/store/chat";
import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";

interface CommandMenuProps {
  commands: CommandSuggestion[];
  selectedIndex: number;
  onSelect: (command: CommandSuggestion) => void;
  onClose: () => void;
  commandListRef: React.RefObject<HTMLDivElement>;
  onExecute: (command: CommandSuggestion) => void;
}

export function CommandMenu({
  commands,
  selectedIndex,
  onSelect,
  onClose,
  commandListRef,
  onExecute,
}: CommandMenuProps) {
  const handleCommandExecution = (command: CommandSuggestion) => {
    onExecute(command);
  };

  if (commands.length === 0) return null;

  return (
    <div
      ref={commandListRef}
      className="absolute bottom-full left-0 right-0 mb-2 w-full z-30"
    >
      <AnimatedSizeContainer
        height
        className="bg-[#f7f7f7]/85 dark:bg-[#171717]/85 backdrop-blur-lg max-h-80 overflow-y-auto"
        transition={{
          type: "spring",
          duration: 0.2,
          bounce: 0.1,
          ease: "easeOut",
        }}
        style={{
          transformOrigin: "bottom center",
        }}
      >
        <div className="p-2">
          {commands.map((command, index) => {
            const isActive = selectedIndex === index;
            return (
              <div
                key={`${command.command}-${index}`}
                className={cn(
                  "px-2 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between group",
                  isActive
                    ? "bg-black/5 dark:bg-white/5"
                    : "hover:bg-black/5 dark:hover:bg-white/5",
                )}
                onClick={() => handleCommandExecution(command)}
                data-index={index}
              >
                <div>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {command.title}
                  </span>
                </div>
                {isActive && (
                  <span className="material-icons-outlined text-sm opacity-50 group-hover:opacity-100 text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white">
                    <Icons.ArrowForward />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </AnimatedSizeContainer>
    </div>
  );
}
