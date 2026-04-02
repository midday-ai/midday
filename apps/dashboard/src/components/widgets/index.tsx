"use client";

import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useOpenPanel } from "@openpanel/nextjs";
import { parseAsBoolean, useQueryState } from "nuqs";
import { Suspense, useCallback } from "react";
import { ChatProvider } from "@/components/chat/chat-context";
import { ChatTitle } from "@/components/chat/chat-title";
import { ChatView } from "@/components/chat/chat-view";
import { NewChatButton } from "@/components/chat/new-chat-button";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { AskMidday } from "./ask-midday";
import { McpBanner } from "./mcp-banner";
import { SummarySkeleton, WidgetCardsSkeleton } from "./overview-skeleton";
import { QuickActions } from "./quick-actions";
import { WelcomeGreeting, WelcomeSummary } from "./welcome-section";
import { WidgetCards } from "./widget-cards";

export function OverviewView() {
  const [assistant, setAssistant] = useQueryState("assistant", parseAsBoolean);
  const { track } = useOpenPanel();
  const { setParams: setInvoiceParams } = useInvoiceParams();

  const isChat = assistant === true;

  const openChat = useCallback(() => {
    track(LogEvents.AssistantOpened.name);
    setAssistant(true);
  }, [track, setAssistant]);

  const goBack = useCallback(() => {
    setInvoiceParams(null);
    setAssistant(null);
  }, [setInvoiceParams, setAssistant]);

  return (
    <ChatProvider>
      {isChat && (
        <div>
          <ChatView
            header={
              <>
                <Button variant="outline" size="icon" onClick={goBack}>
                  <Icons.ArrowBack className="size-4" />
                </Button>
                <ChatTitle />
                <NewChatButton variant="outline" />
              </>
            }
          />
        </div>
      )}

      {!isChat && (
        <div className="mt-2 pb-16 flex flex-col justify-center min-h-[calc(100vh-120px)] max-w-3xl mx-auto w-full">
          <div className="flex flex-col items-center text-center pt-6 pb-10 w-full">
            <WelcomeGreeting />
            <Suspense fallback={<SummarySkeleton />}>
              <WelcomeSummary />
            </Suspense>
          </div>
          <AskMidday onChatOpen={openChat} />
          <QuickActions onChatOpen={openChat} />
          <Suspense fallback={<WidgetCardsSkeleton />}>
            <WidgetCards />
          </Suspense>
          <McpBanner />
        </div>
      )}
    </ChatProvider>
  );
}
