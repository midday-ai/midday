"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useCallback, useState } from "react";
import { AskMidday, ChatProvider, ChatView } from "./ask-midday";
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
            <Button variant="ghost" size="icon" onClick={goBack}>
              <Icons.ArrowBack className="size-4" />
            </Button>
            <ChatView.NewChatButton />
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
