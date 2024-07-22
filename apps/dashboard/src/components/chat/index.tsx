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
import { useDropzone } from "react-dropzone";
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
  const [attachment, setAttachment] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = (acceptedFiles) => {
    setAttachment(acceptedFiles.at(0));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,

    maxSize: 3000000, // 3MB
    accept: {
      // "image/png": [".png"],
      // "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
  });

  const { message } = useAssistantStore();

  const onSubmit = async (input: string) => {
    const value = input.trim();

    if (value.length === 0) {
      return null;
    }

    const formData = new FormData();

    if (attachment) {
      formData.append("attachment", attachment);
    }

    formData.append("content", value);

    setInput("");
    scrollToBottom();

    submitMessage((message: ClientMessage[]) => [
      ...message,
      {
        id: nanoid(),
        role: "user",
        display: <UserMessage>{value}</UserMessage>,
      },
    ]);

    const responseMessage = await submitUserMessage(formData);

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
    <div
      className="relative"
      {...getRootProps({
        onClick: (event) => event.stopPropagation(),
      })}
    >
      <ScrollArea className="todesktop:h-[335px] md:h-[335px]" ref={scrollRef}>
        <div ref={messagesRef}>
          {messages.length ? (
            <ChatList messages={messages} className="p-4 pb-8" />
          ) : isDragActive ? (
            <div className="flex items-center justify-center mt-[150px]">
              <p className="text-xs">Drop your files upload</p>
            </div>
          ) : (
            <ChatEmpty firstName={user?.full_name.split(" ").at(0)} />
          )}

          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </ScrollArea>

      <div className="fixed bottom-[1px] left-[1px] right-[1px] todesktop:h-[88px] md:h-[88px] bg-background border-border border-t-[1px]">
        {!isDragActive && showExamples && !attachment && (
          <ChatExamples onSubmit={onSubmit} />
        )}

        <div className="flex flex-row gap-2 fixed right-2 bottom-28 items-end text-xs">
          {attachment?.name}
        </div>

        <form
          ref={formRef}
          onSubmit={(evt) => {
            evt.preventDefault();
            onSubmit(input);
            setAttachment(undefined);

            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            {...getInputProps()}
          />

          <Button
            variant="outline"
            size="icon"
            className="absolute size-7 left-3 top-[9px] rounded-full"
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
            className="h-12 min-h-12 pt-3 pl-12 resize-none border-none"
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
