"use client";

import type { AI } from "@/actions/ai/chat";
import { getUIStateFromAIState } from "@/actions/ai/chat/utils";
import { getChat } from "@/actions/ai/storage";
import { Chat } from "@/components/chat";
import { useAssistantStore } from "@/store/assistant";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { nanoid } from "ai";
import { useAIState, useUIState } from "ai/rsc";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Header } from "./header";
import { SidebarList } from "./sidebar-list";

export function Assistant() {
  const { isOpen, setOpen } = useAssistantStore();
  const [isExpanded, setExpanded] = useState(false);
  const [chatId, setChatId] = useState();
  const [messages, setMessages] = useUIState<typeof AI>();
  const [_, setAIState] = useAIState<typeof AI>();

  const toggleOpen = () => setExpanded((prev) => !prev);

  const onNewChat = () => {
    setExpanded(false);
    setAIState((prev) => ({ ...prev, messages: [], chatId: nanoid() }));
    setMessages([]);
  };

  const handleOnSelect = (id: string) => {
    setExpanded(false);
    setChatId(id);
  };

  useHotkeys("meta+k", () => setOpen(), {
    enableOnFormTags: true,
  });
  useHotkeys("meta+j", () => onNewChat(), {
    enableOnFormTags: true,
  });

  useEffect(() => {
    async function fetchData() {
      const result = await getChat(chatId);

      if (result) {
        setAIState((prev) => ({ ...prev, messages: result.messages }));
        setMessages(getUIStateFromAIState(result));
      }
    }

    fetchData();
  }, [chatId]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 max-w-[740px] h-[480px]"
        hideClose
      >
        <SidebarList
          onNewChat={onNewChat}
          isExpanded={isExpanded}
          setExpanded={setExpanded}
          setOpen={setOpen}
          onSelect={handleOnSelect}
          chatId={chatId}
        />

        <Header toggleSidebar={toggleOpen} isExpanded={isExpanded} />
        <Chat submitMessage={setMessages} messages={messages} />
      </DialogContent>
    </Dialog>
  );
}
