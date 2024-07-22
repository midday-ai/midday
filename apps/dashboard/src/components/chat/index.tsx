import type { ClientMessage } from "@/actions/ai/types";
import { useEnterSubmit } from "@/hooks/use-enter-submit";
import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
import { useAssistantStore } from "@/store/assistant";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Textarea } from "@midday/ui/textarea";
import { useActions } from "ai/rsc";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { ChatEmpty } from "./chat-empty";
import { ChatExamples } from "./chat-examples";
import { ChatFooter } from "./chat-footer";
import { ChatList } from "./chat-list";
import { UserMessage } from "./messages";

export function Chat({
  messages,
  submitMessage,
  user,
  onNewChat,
  input,
  setInput,
  showFeedback,
}) {
  const { submitUserMessage } = useActions();
  const { formRef, onKeyDown } = useEnterSubmit();
  const ref = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { message } = useAssistantStore();

  const onSubmit = async (input: string) => {
    const value = input.trim();

    if (value.length === 0) {
      return null;
    }

    setInput("");
    scrollToBottom();

    console.log(files);

    submitMessage((message: ClientMessage[]) => [
      ...message,
      {
        id: nanoid(),
        role: "user",
        experimental_attachments: files,
        display: <UserMessage>{value}</UserMessage>,
      },
    ]);

    const responseMessage = await submitUserMessage({
      content: value,
      experimental_attachments: files,
    });

    submitMessage((messages: ClientMessage[]) => [
      ...messages,
      responseMessage,
    ]);
  };

  useEffect(() => {
    if (!ref.current && message) {
      onNewChat();
      onSubmit(message);
      ref.current = true;
    }
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef?.current.focus();
    });
  }, [messages]);

  const { messagesRef, scrollRef, visibilityRef, scrollToBottom } =
    useScrollAnchor();

  const showExamples = messages.length === 0 && !input;

  return (
    <div className="relative">
      <ScrollArea className="todesktop:h-[335px] md:h-[335px]" ref={scrollRef}>
        <div ref={messagesRef}>
          {messages.length ? (
            <ChatList messages={messages} className="p-4 pb-8" />
          ) : (
            <ChatEmpty firstName={user?.full_name.split(" ").at(0)} />
          )}

          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </ScrollArea>

      <div className="fixed bottom-[1px] left-[1px] right-[1px] todesktop:h-[88px] md:h-[88px] bg-background border-border border-t-[1px]">
        {showExamples && <ChatExamples onSubmit={onSubmit} />}

        <form
          ref={formRef}
          onSubmit={(evt) => {
            evt.preventDefault();
            onSubmit(input);
            setFiles(undefined);

            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        >
          <input
            type="file"
            className="hidden"
            onChange={(event) => {
              if (event.target.files) {
                setFiles(event.target.files);
              }
            }}
            multiple
            ref={fileInputRef}
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute left-3 top-[6px] rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icons.Add />
          </Button>

          <Textarea
            ref={inputRef}
            tabIndex={0}
            rows={1}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            value={input}
            className="h-12 min-h-12 pt-3 pl-14 resize-none border-none"
            placeholder="Ask Midday a question..."
            onKeyDown={onKeyDown}
            onChange={(evt) => {
              setInput(evt.target.value);
            }}
          />
        </form>

        <ChatFooter
          onSubmit={() => onSubmit(input)}
          showFeedback={showFeedback}
        />
      </div>
    </div>
  );
}
