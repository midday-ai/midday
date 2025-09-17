"use client";

import {
  useChatId,
  useChatSendMessage,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@midday/ui/prompt-input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChatInput() {
  const [input, setInput] = useState("");
  const sendMessage = useChatSendMessage();
  const status = useChatStatus();
  const chatId = useChatId();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      router.push(`/${chatId}`);

      sendMessage({
        role: "user",
        parts: [{ type: "text", text: input }],
      });

      setInput("");
    }
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 z-20 px-6">
      <div className="mx-auto w-full bg-[#F7F7F7] dark:bg-[#131313] pt-2 max-w-[770px]">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            maxHeight={30}
            minHeight={30}
            value={input}
            placeholder="Ask me anything"
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
