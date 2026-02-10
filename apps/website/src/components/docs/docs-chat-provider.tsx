"use client";

import { cn } from "@midday/ui/cn";
import { parseAsBoolean, useQueryState } from "nuqs";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ChatPanel, type ChatPanelRef } from "./chat-panel";

type DocsChatContextType = {
  openChat: (message: string) => void;
  sendMessage: (message: string) => void;
  isChatOpen: boolean;
};

const DocsChatContext = createContext<DocsChatContextType | null>(null);

export function useDocsChat() {
  const context = useContext(DocsChatContext);
  // Return safe defaults during SSR/static generation
  if (!context) {
    return {
      openChat: () => {},
      sendMessage: () => {},
      isChatOpen: false,
    };
  }
  return context;
}

type DocsChatProviderProps = {
  children: ReactNode;
};

export function DocsChatProvider({ children }: DocsChatProviderProps) {
  const [isChatOpen, setIsChatOpen] = useQueryState(
    "chat",
    parseAsBoolean.withDefault(false),
  );
  const [initialMessage, setInitialMessage] = useState<string | undefined>();
  const chatPanelRef = useRef<ChatPanelRef>(null);

  const openChat = useCallback(
    (message: string) => {
      setInitialMessage(message);
      setIsChatOpen(true);
    },
    [setIsChatOpen],
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (isChatOpen && chatPanelRef.current) {
        chatPanelRef.current.sendMessage(message);
      } else {
        openChat(message);
      }
    },
    [isChatOpen, openChat],
  );

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
    setInitialMessage(undefined);
  }, [setIsChatOpen]);

  return (
    <DocsChatContext.Provider value={{ openChat, sendMessage, isChatOpen }}>
      {/* Main content that gets pushed */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isChatOpen && "md:mr-[480px] lg:mr-[520px]",
        )}
      >
        {children}
      </div>

      {/* Chat panel */}
      <ChatPanel
        ref={chatPanelRef}
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        initialMessage={initialMessage}
      />
    </DocsChatContext.Provider>
  );
}
