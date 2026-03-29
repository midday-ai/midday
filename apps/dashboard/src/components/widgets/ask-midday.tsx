"use client";

import { useChat } from "@ai-sdk/react";
import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  ManusMcpLogo,
  PerplexityMcpLogo,
} from "@midday/app-store/logos";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { getAccessToken } from "@/utils/session";

const mcpApps = [
  { Logo: ChatGPTMcpLogo, name: "ChatGPT", id: "chatgpt-mcp" },
  { Logo: ClaudeMcpLogo, name: "Claude", id: "claude-mcp" },
  { Logo: PerplexityMcpLogo, name: "Perplexity", id: "perplexity-mcp" },
  { Logo: ManusMcpLogo, name: "Manus", id: "manus-mcp" },
];

const chatTransport = new DefaultChatTransport({
  api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
  headers: async () => {
    const token = await getAccessToken();
    return token
      ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
      : ({} as Record<string, string>);
  },
});

type ChatState = ReturnType<typeof useChat> & {
  inputValue: string;
  setInputValue: (v: string) => void;
};

const ChatContext = createContext<ChatState | null>(null);

function useChatState() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatState must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [inputValue, setInputValue] = useState("");
  const chat = useChat({
    transport: chatTransport,
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  return (
    <ChatContext.Provider value={{ ...chat, inputValue, setInputValue }}>
      {children}
    </ChatContext.Provider>
  );
}

export function McpConnect() {
  return (
    <div className="flex justify-center mt-auto pt-8">
      <div className="flex items-center gap-2 border border-border rounded-full px-3 py-1.5">
        <span className="text-xs text-[#878787]/60">Connect</span>
        <McpLogos />
      </div>
    </div>
  );
}

function McpLogos() {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center -space-x-1">
        {mcpApps.map(({ Logo, name, id }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Link
                href={`?mcp-app=${id}`}
                className="size-5 rounded-full overflow-hidden border-2 border-background hover:z-10 hover:scale-110 transition-transform [&_img]:!w-full [&_img]:!h-full [&_img]:!rounded-none [&_svg]:!w-full [&_svg]:!h-full [&_svg]:!rounded-none"
                onClick={(e) => e.stopPropagation()}
              >
                <Logo />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Use in {name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function InputBar({
  isActive,
  hasMessages,
  inputValue,
  isStreaming,
  onChange,
  onSubmit,
  onStop,
  onEscape,
  onSuggestion,
}: {
  isActive?: boolean;
  hasMessages?: boolean;
  inputValue: string;
  isStreaming: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onEscape?: () => void;
  onSuggestion?: (text: string) => void;
}) {
  return (
    <div className="bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] backdrop-blur-lg">
      <ChatInput
        value={inputValue}
        onChange={onChange}
        onSubmit={onSubmit}
        onStop={onStop}
        isStreaming={isStreaming}
        placeholder={hasMessages ? "Ask a follow-up..." : "Ask anything"}
        autoFocus={isActive}
        onEscape={onEscape}
        onSuggestion={onSuggestion}
      />
    </div>
  );
}

export function AskMidday({ onChatOpen }: { onChatOpen: () => void }) {
  const { sendMessage, setMessages, status, stop, inputValue, setInputValue } =
    useChatState();

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;
    const text = inputValue.trim();
    setInputValue("");
    setMessages([]);
    sendMessage({ text });
    onChatOpen();
  }, [
    inputValue,
    isStreaming,
    sendMessage,
    setMessages,
    setInputValue,
    onChatOpen,
  ]);

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setMessages([]);
      sendMessage({ text: suggestion });
      onChatOpen();
    },
    [sendMessage, setMessages, onChatOpen],
  );

  return (
    <div className="pb-10 w-full">
      <InputBar
        inputValue={inputValue}
        isStreaming={isStreaming}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        onStop={stop}
        onSuggestion={handleSuggestion}
      />
    </div>
  );
}

function ChatViewComponent({ onClose }: { onClose: () => void }) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    inputValue,
    setInputValue,
  } = useChatState();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;
    const text = inputValue.trim();
    setInputValue("");
    sendMessage({ text });
  }, [inputValue, isStreaming, sendMessage, setInputValue]);

  return (
    <div className="h-[calc(100vh-160px)]">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="max-w-[680px] mx-auto pt-4 whitespace-normal">
          <ChatMessages messages={messages} status={status} />
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive text-center py-2">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="fixed bottom-0 left-0 md:left-[70px] right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 z-40">
        <div className="max-w-[680px] mx-auto w-full px-4">
          <InputBar
            isActive
            hasMessages
            inputValue={inputValue}
            isStreaming={isStreaming}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={stop}
            onSuggestion={(text) => {
              sendMessage({ text });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function NewChatButton() {
  const { setMessages, setInputValue } = useChatState();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        setMessages([]);
        setInputValue("");
      }}
    >
      <Icons.Add className="size-4" />
    </Button>
  );
}

export const ChatView = Object.assign(ChatViewComponent, { NewChatButton });
