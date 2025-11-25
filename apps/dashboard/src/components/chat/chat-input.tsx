"use client";

import { CommandMenu } from "@/components/chat/command-menu";
import { RecordButton } from "@/components/chat/record-button";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { SuggestedActionsButton } from "@/components/suggested-actions-button";
import { WebSearchButton } from "@/components/web-search-button";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useChatStore } from "@/store/chat";
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import {
  useChatActions,
  useChatId,
  useChatStatus,
  useDataPart,
} from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@midday/ui/prompt-input";
import { parseAsString, useQueryState } from "nuqs";
import { useRef } from "react";

export interface ChatInputMessage extends PromptInputMessage {
  metadata?: {
    agentChoice?: string;
    toolChoice?: string;
  };
}

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const status = useChatStatus();
  const { sendMessage, stop } = useChatActions();
  const chatId = useChatId();
  const { setChatId, isHome } = useChatInterface();

  const [, clearSuggestions] = useDataPart<{ prompts: string[] }>(
    "suggestions",
  );

  const [selectedType] = useQueryState("artifact-type", parseAsString);

  const isCanvasVisible = !!selectedType;

  const {
    input,
    isWebSearch,
    isUploading,
    isRecording,
    isProcessing,
    showCommands,
    selectedCommandIndex,
    filteredCommands,
    setInput,
    handleInputChange,
    handleKeyDown,
    resetCommandState,
  } = useChatStore();

  const handleSubmit = (message: ChatInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // If currently streaming, stop the current stream first
    if (status === "streaming" || status === "submitted") {
      stop?.();
      // Continue to send the new message after stopping
    }

    // Clear old suggestions before sending new message
    clearSuggestions();

    // Set chat ID to ensure proper URL routing
    if (chatId) {
      setChatId(chatId);
    }

    sendMessage({
      text: message.text || "Sent with attachments",
      files: message.files,
      metadata: {
        agentChoice: message.metadata?.agentChoice,
        toolChoice: message.metadata?.toolChoice,
      },
    });
    setInput("");
    resetCommandState();
  };

  const handleStopClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent form submission when stopping
    e.preventDefault();
    e.stopPropagation();

    if (status === "streaming" || status === "submitted") {
      stop?.();
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 z-20 transition-all duration-300 ease-in-out",
          "left-0 md:left-[70px] px-4 md:px-6",
          isCanvasVisible ? "right-0 md:right-[603px]" : "right-0",
          isHome && "chat-input-static",
        )}
      >
        <div className="mx-auto w-full pt-2 max-w-full md:max-w-[770px] relative">
          <SuggestedPrompts />
          <CommandMenu />

          <PromptInput onSubmit={handleSubmit} globalDrop multiple>
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                ref={textareaRef}
                autoFocus
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  // Handle Enter key for commands
                  if (e.key === "Enter" && showCommands) {
                    e.preventDefault();
                    const selectedCommand =
                      filteredCommands[selectedCommandIndex];
                    if (selectedCommand) {
                      // Execute command through the store
                      if (!chatId) return;

                      // Clear old suggestions before sending new message
                      clearSuggestions();

                      setChatId(chatId);

                      sendMessage({
                        role: "user",
                        parts: [{ type: "text", text: selectedCommand.title }],
                        metadata: {
                          toolCall: {
                            toolName: selectedCommand.toolName,
                            toolParams: selectedCommand.toolParams,
                          },
                        },
                      });

                      setInput("");
                      resetCommandState();
                    }
                    return;
                  }

                  // Handle Enter key for normal messages - trigger form submission
                  if (e.key === "Enter" && !showCommands && !e.shiftKey) {
                    // Don't submit if IME composition is in progress
                    if (e.nativeEvent.isComposing) {
                      return;
                    }

                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) {
                      form.requestSubmit();
                    }
                    return;
                  }

                  // Handle other keys normally
                  handleKeyDown(e);
                }}
                value={input}
                placeholder={isWebSearch ? "Search the web" : "Ask anything"}
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputActionAddAttachments />
                <SuggestedActionsButton />
                <WebSearchButton />
              </PromptInputTools>

              <PromptInputTools>
                <RecordButton size={16} />
                <PromptInputSubmit
                  disabled={
                    // Enable button when streaming so user can stop
                    status === "streaming" || status === "submitted"
                      ? false
                      : (!input && !status) ||
                        isUploading ||
                        isRecording ||
                        isProcessing
                  }
                  status={status}
                  onClick={
                    status === "streaming" || status === "submitted"
                      ? handleStopClick
                      : undefined
                  }
                />
              </PromptInputTools>
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </>
  );
}
