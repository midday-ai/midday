"use client";

import { ChatHistory } from "@/components/chat/chat-history";
import { NewChat } from "@/components/chat/new-chat";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { chatTitleArtifact } from "@api/ai/artifacts/chat-title";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { TextEffect } from "@midday/ui/text-effect";
import { useRouter } from "next/navigation";

export function ChatHeader() {
  const router = useRouter();
  const { isHome } = useChatInterface();
  const { data } = useArtifact(chatTitleArtifact);

  if (isHome) {
    return null;
  }

  return (
    <div className="relative z-10 bg-background py-6 flex justify-between w-full px-6">
      <div className="flex items-center">
        <Button variant="outline" size="icon" onClick={() => router.push("/")}>
          <Icons.ArrowBack size={16} />
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center justify-center transition-all duration-300 ease-in-out",
        )}
      >
        {data && (
          <TextEffect
            per="char"
            preset="fade"
            speedReveal={3}
            speedSegment={2}
            className="text-sm font-regular truncate"
          >
            {data.title}
          </TextEffect>
        )}
      </div>

      <div className="flex items-center space-x-4 transition-all duration-300 ease-in-out">
        <NewChat />
        <ChatHistory />
      </div>
    </div>
  );
}
