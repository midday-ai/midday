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
  const { setChatId } = useChatInterface();
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });
  const [, clearSuggestions] = useDataPart<{ prompts: string[] }>(
    "suggestions",
  );

  const isCanvasVisible = !!current;

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

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-[70px] z-20 px-6 transition-all duration-300 ease-in-out",
          isCanvasVisible ? "right-[603px]" : "right-0",
        )}
      >
        <div className="mx-auto w-full pt-2 max-w-[770px] relative">
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

                  // Handle Enter key for normal messages
                  if (e.key === "Enter" && !showCommands) {
                    e.preventDefault();
                    if (input.trim()) {
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
                        text: input,
                        files: [],
                        metadata: {
                          webSearch: isWebSearch,
                        },
                      });

                      setInput("");
                      resetCommandState();
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
                    (!input && !status) ||
                    isUploading ||
                    isRecording ||
                    isProcessing
                  }
                  status={status}
                />
              </PromptInputTools>
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </>
  );
}
