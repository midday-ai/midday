import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import type { UseChatHelpers } from "@ai-sdk/react";
import { cn } from "@midday/ui/cn";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { memo } from "react";
import { PreviewMessage, ThinkingMessage } from "./message";

interface MessagesProps {
  status: UseChatHelpers["status"];
  messages: Array<UIMessage>;
}

function PureMessages({ status, messages }: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll select-text p-4 h-full"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          message={message}
          isLoading={status === "streaming" && messages.length - 1 === index}
        />
      ))}

      {status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" && <ThinkingMessage />}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});

export function BotMessage({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-2 text-xs font-mono leading-relaxed w-[640px] mb-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
