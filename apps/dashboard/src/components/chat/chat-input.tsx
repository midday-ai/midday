"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Textarea } from "@midday/ui/textarea";

type Props = {
  setInput: UseChatHelpers["setInput"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  input: UseChatHelpers["input"];
};

export function ChatInput({ handleSubmit, input, setInput }: Props) {
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  return (
    <Textarea
      onChange={handleInput}
      placeholder="Ask Midday a question..."
      value={input}
      className="flex w-full border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 h-12 min-h-12 pt-3 resize-none border-none"
      rows={1}
      autoFocus
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault();

          handleSubmit();
        }
      }}
    />
  );
}
