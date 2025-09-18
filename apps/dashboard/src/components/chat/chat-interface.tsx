"use client";

import { Canvas } from "@/components/canvas/canvas";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { Messages } from "@/components/chat/messages";
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { cn } from "@midday/ui/cn";

type Props = {
  initialTitle?: string | null;
};

export function ChatInterface({ initialTitle }: Props) {
  const { current } = useArtifacts();
  const isCanvasVisible = !!current;

  return (
    <div className="relative h-full overflow-hidden w-full">
      <div
        className={cn(
          "relative h-full w-full transition-all duration-300 ease-in-out",
          isCanvasVisible && "pr-[603px]",
        )}
      >
        <ChatHeader title={initialTitle} />

        <div className="relative w-full">
          <Messages />
          <ChatInput />
        </div>
      </div>

      <Canvas />
    </div>
  );
}
