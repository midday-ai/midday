"use client";

import { getUIStateFromAIState } from "@/actions/ai/chat/utils";
import { ChatList } from "@/components/chat/chat-list";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AssistantInput } from "./assistant-input";
import { AssistantList } from "./assistant-list";

export function AssistantWidget() {
  const trpc = useTRPC();

  const { data: chat } = useSuspenseQuery(
    trpc.assistant.history.queryOptions(),
  );

  return (
    <div>
      <div className="mt-8 overflow-auto scrollbar-hide pb-32 aspect-square flex flex-col-reverse">
        {chat ? (
          <ChatList messages={getUIStateFromAIState(chat)} />
        ) : (
          <AssistantList />
        )}
      </div>
      <AssistantInput />
    </div>
  );
}
