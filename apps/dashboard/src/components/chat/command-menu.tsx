"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useChatStore } from "@/store/chat";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useEffect, useRef } from "react";
import { useOnClickOutside } from "usehooks-ts";

export function CommandMenu() {
  const commandListRef = useRef<HTMLDivElement>(null);
  const {
    filteredCommands,
    selectedCommandIndex,
    showCommands,
    handleCommandSelect,
    resetCommandState,
    setInput,
    setShowCommands,
  } = useChatStore();

  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();

  // Close command menu when clicking outside (but not on the toggle button)
  useOnClickOutside(commandListRef, (event) => {
    if (showCommands) {
      // Check if the click was on the suggested actions toggle button
      const target = event.target as Element;
      const isToggleButton = target.closest("[data-suggested-actions-toggle]");

      // Only close if it's not the toggle button
      if (!isToggleButton) {
        setShowCommands(false);
      }
    }
  });

  const handleCommandExecution = (command: any) => {
    if (!chatId) return;

    setChatId(chatId);

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: command.title }],
      metadata: {
        toolCall: {
          toolName: command.toolName,
          toolParams: command.toolParams,
        },
      },
    });

    setInput("");
    resetCommandState();
  };

  // Scroll selected command into view
  useEffect(() => {
    if (commandListRef.current && showCommands) {
      const selectedElement = commandListRef.current.querySelector(
        `[data-index="${selectedCommandIndex}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedCommandIndex, showCommands]);

  if (!showCommands || filteredCommands.length === 0) return null;

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
          {filteredCommands.map((command, index) => {
            const isActive = selectedCommandIndex === index;
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
                  <span className="text-[#666] ml-2">{command.title}</span>
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
