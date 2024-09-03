"use client";

import { nanoid } from "nanoid";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Chat } from "./chat";
import { chatExamples } from "./examples";
import { Header } from "./header";
import { BotCard, UserMessage } from "./messages";
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
    const content = chatExamples.find(
      (example) => example.title === message,
    )?.content;

    setExpanded(false);

    if (content) {
      setMessages([
        {
          id: nanoid(),
          role: "user",
          display: <UserMessage>{message}</UserMessage>,
        },
        {
          id: nanoid(),
          role: "assistant",
          display: <BotCard content={content} />,
        },
      ]);
    }
  };

  useHotkeys("meta+j", () => onNewChat(), {
    enableOnFormTags: true,
  });

  return (
    <div className="overflow-hidden p-0 w-[760px] h-full md:h-[480px] backdrop-filter backdrop-blur-xl bg-[#121212] bg-opacity-80 border-border border rounded-md relative">
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
