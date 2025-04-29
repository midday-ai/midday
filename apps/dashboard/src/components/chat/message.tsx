"use client";

import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { memo } from "react";
import { ChatAvatar } from "./chat-avatar";
import { Markdown } from "./markdown";
import { spinner } from "./spinner";
import { Inbox } from "./tools/Inbox/Inbox";
import { BurnRate } from "./tools/burn-rate/burn-rate";
import { Documents } from "./tools/documents/documents";
import { Profit } from "./tools/profit/profit";
import { Revenue } from "./tools/revenue/revenue";
import { Transactions } from "./tools/transactions/transactions";

function ToolResult({ part }: { part: UIMessage["parts"][number] }) {
  if (part.type !== "tool-invocation") {
    return null;
  }

  const { toolInvocation } = part;

  if (toolInvocation.state === "result") {
    switch (toolInvocation.toolName) {
      case "getDocuments":
        return <Documents result={toolInvocation.result} />;
      case "getBurnRate":
        return <BurnRate result={toolInvocation.result} />;
      case "getTransactions":
        return <Transactions result={toolInvocation.result} />;
      case "getRevenue":
        return <Revenue result={toolInvocation.result} />;
      case "getProfit":
        return <Profit result={toolInvocation.result} />;
      case "getInbox":
        return <Inbox result={toolInvocation.result} />;
      default:
        return null;
    }
  }
}

const PurePreviewMessage = ({
  message,
}: {
  message: UIMessage;
  isLoading: boolean;
}) => {
  return (
    <div
      className="group relative flex items-start w-full"
      data-role={message.role}
    >
      <div className="group relative flex items-start">
        <ChatAvatar role={message.role} />

        <div className="flex flex-col w-full pl-4">
          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

            if (type === "text") {
              return (
                <div
                  key={key}
                  className="space-y-2 text-xs font-mono leading-relaxed mb-2"
                >
                  <Markdown>{part.text}</Markdown>
                </div>
              );
            }

            if (type === "tool-invocation") {
              return <ToolResult part={part} key={key} />;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <div className="group relative flex items-start w-full" data-role={role}>
      <div className="group relative flex items-start">
        <ChatAvatar role={role} />
        <div className="flex flex-col w-full pl-4">{spinner}</div>
      </div>
    </div>
  );
};
