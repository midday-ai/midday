"use client";

import { FollowupQuestions } from "@/components/chat/followup-questions";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { useChatActions, useChatId, useChatStatus } from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@midday/ui/prompt-input";
import { useState } from "react";

export function ChatInput() {
  const [input, setInput] = useState("");
  const { sendMessage } = useChatActions();
  const status = useChatStatus();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { current } = useArtifacts();
  const isCanvasVisible = !!current;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim() && chatId) {
      // Set chatId as query parameter using nuqs
      setChatId(chatId);

      sendMessage({
        role: "user",
        parts: [{ type: "text", text: input }],
      });

      setInput("");
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-8 left-[70px] z-20 px-6 transition-all duration-300 ease-in-out",
        isCanvasVisible ? "right-[603px]" : "right-0",
      )}
    >
      <div className="mx-auto w-full bg-[#F7F7F7] dark:bg-[#131313] pt-2 max-w-[770px] relative">
        <FollowupQuestions />

        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            maxHeight={30}
            minHeight={30}
            value={input}
            placeholder="Ask me anything"
            autoFocus
          />
          <PromptInputToolbar className="pb-1 px-4">
            <PromptInputTools>
              <PromptInputButton className="-ml-2">
                <Icons.Add className="size-4" />
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              status={status}
              className="mr-0 mb-2"
              size="icon"
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
