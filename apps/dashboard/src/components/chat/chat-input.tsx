"use client";

import { CommandMenu } from "@/components/chat/command-menu";
import { FollowupQuestions } from "@/components/chat/followup-questions";
import { RecordButton } from "@/components/chat/record-button";
import { WebSearchButton } from "@/components/web-search-button";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { type CommandSuggestion, useChatStore } from "@/store/chat";
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { useChatActions, useChatId, useChatStatus } from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@midday/ui/prompt-input";
import { useRef } from "react";

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const status = useChatStatus();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });
  const isCanvasVisible = !!current;

  const {
    input,
    webSearch,
    isUploading,
    showCommands,
    selectedCommandIndex,
    filteredCommands,
    setInput,
    setWebSearch,
    setIsUploading,
    handleInputChange,
    handleKeyDown,
    resetCommandState,
  } = useChatStore();

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    let processedFiles = message.files;

    // Convert blob URLs to data URLs for server compatibility
    if (message.files && message.files.length > 0) {
      setIsUploading(true);
      try {
        processedFiles = await Promise.all(
          message.files.map(async (file) => {
            // If it's a blob URL, convert to data URL
            if (file.url.startsWith("blob:")) {
              const response = await fetch(file.url);
              const blob = await response.blob();

              // Convert blob to data URL
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              return {
                ...file,
                url: dataUrl,
              };
            }

            // Return file as-is if not a blob URL
            return file;
          }),
        );
      } catch (error) {
        console.error("Failed to process files:", error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Set chat ID to ensure proper URL routing
    if (chatId) {
      setChatId(chatId);
    }

    sendMessage({
      text: message.text || "Sent with attachments",
      files: processedFiles,
      metadata: {
        webSearch,
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
          <FollowupQuestions />

          {/* Command Suggestions Menu */}
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
                      // Set chat ID to ensure proper URL routing
                      if (chatId) {
                        setChatId(chatId);
                      }

                      sendMessage({
                        text: input,
                        files: [],
                        metadata: {
                          webSearch,
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
                placeholder={
                  webSearch
                    ? "Search the web"
                    : "Ask anything or press ´/´ for commands..."
                }
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputActionAddAttachments />
                <WebSearchButton
                  webSearch={webSearch}
                  onWebSearch={() => setWebSearch(!webSearch)}
                />
              </PromptInputTools>

              <PromptInputTools>
                <RecordButton size={16} />
                <PromptInputSubmit
                  disabled={(!input && !status) || isUploading}
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
