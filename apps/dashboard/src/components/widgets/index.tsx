"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useCallback, useState } from "react";
import { ChatProvider } from "@/components/chat/chat-context";
import { ChatTitle } from "@/components/chat/chat-title";
import { ChatView } from "@/components/chat/chat-view";
import { NewChatButton } from "@/components/chat/new-chat-button";
import { AskMidday } from "./ask-midday";
import { McpBanner } from "./mcp-banner";
import { QuickActions } from "./quick-actions";
import { WelcomeSection } from "./welcome-section";
import { WidgetCards } from "./widget-cards";

type SubView = "overview" | "chat";

export function OverviewView() {
  const [view, setView] = useState<SubView>("overview");

  const goBack = useCallback(() => setView("overview"), []);

  return (
    <ChatProvider>
      {view === "chat" && (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goBack}>
              <Icons.ArrowBack className="size-4" />
            </Button>
            <ChatTitle />
            <NewChatButton variant="outline" />
          </div>
          <ChatView onClose={goBack} />
        </div>
      )}

      {view === "overview" && (
        <div className="mt-2 pb-16 flex flex-col justify-center min-h-[calc(100vh-120px)] max-w-3xl mx-auto w-full">
          <WelcomeSection />
          <AskMidday onChatOpen={() => setView("chat")} />
          <QuickActions />
          <WidgetCards />
        </div>
      )}
      <McpBanner />
    </ChatProvider>
  );
}
