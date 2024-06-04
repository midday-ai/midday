"use client";

import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Chat } from "./chat";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function Assistant() {
  const [isExpanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const toggleOpen = () => setExpanded((prev) => !prev);

  const onNewChat = () => {
    setExpanded(false);
    setInput("");
    setMessages([]);
  };

  const handleOnSelect = (message: string) => {
    console.log(message);
    setExpanded(false);
    setMessages([message]);
    // setMessages((messages) => [...messages, {message}]);
  };

  useHotkeys("meta+j", () => onNewChat(), {
    enableOnFormTags: true,
  });

  return (
    <div className="overflow-hidden p-0 max-w-[760px] h-[480px] bg-background border-border border w-full rounded-md relative">
      <Header toggleSidebar={toggleOpen} isExpanded={isExpanded} />
      <Sidebar
        setExpanded={setExpanded}
        isExpanded={isExpanded}
        onNewChat={onNewChat}
        onSelect={handleOnSelect}
      />

      <Chat
        onNewChat={onNewChat}
        messages={messages}
        setInput={setInput}
        input={input}
        submitMessage={setMessages}
      />
    </div>
  );
}
