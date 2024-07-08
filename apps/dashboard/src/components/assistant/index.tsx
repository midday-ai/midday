"use client";

import type { AI } from "@/actions/ai/chat";
import { getUIStateFromAIState } from "@/actions/ai/chat/utils";
import { getChat } from "@/actions/ai/storage";
import { Chat } from "@/components/chat";
import { useAIState, useUIState } from "ai/rsc";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AssistantFeedback } from "./feedback";
import { Header } from "./header";
import { SidebarList } from "./sidebar-list";
import { VoiceAssistant } from "./vocie-assistant";

export function Assistant() {
  const [isExpanded, setExpanded] = useState(false);
  const [isVoice, setVoice] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [chatId, setChatId] = useState();
  const [messages, setMessages] = useUIState<typeof AI>();
  const [aiState, setAIState] = useAIState<typeof AI>();
  const [input, setInput] = useState<string>("");
  const [isUserSpeaking, setUserSpeeking] = useState(false);

  const toggleOpen = () => setExpanded((prev) => !prev);

  const onNewChat = () => {
    const newChatId = nanoid();
    setInput("");
    setExpanded(false);
    setAIState((prev) => ({ ...prev, messages: [], chatId: newChatId }));
    setMessages([]);
    setChatId(newChatId);
  };

  const handleOnSelect = (id: string) => {
    setExpanded(false);
    setChatId(id);
  };

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
    <div className="overflow-hidden p-0 h-full w-full todesktop:max-w-[760px] md:max-w-[760px] md:h-[480px] todesktop:h-[480px]">
      {showFeedback && (
        <AssistantFeedback onClose={() => setShowFeedback(false)} />
      )}

      <SidebarList
        onNewChat={onNewChat}
        isExpanded={isExpanded}
        setExpanded={setExpanded}
        onSelect={handleOnSelect}
        chatId={chatId}
      />

      <Header toggleSidebar={toggleOpen} isExpanded={isExpanded} />

      {isVoice && <VoiceAssistant setUserSpeeking={setUserSpeeking} />}

      <Chat
        submitMessage={setMessages}
        messages={messages}
        user={aiState.user}
        onNewChat={onNewChat}
        setInput={setInput}
        input={input}
        showFeedback={() => setShowFeedback(true)}
        openVocie={() => setVoice((prev) => !prev)}
        isVoice={isVoice}
        isUserSpeaking={isUserSpeaking}
      />
    </div>
  );
}
