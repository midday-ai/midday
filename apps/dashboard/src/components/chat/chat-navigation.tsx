"use client";

import { useChatActions } from "@ai-sdk-tools/store";
import { Button } from "@midday/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useOverviewTab } from "@/hooks/use-overview-tab";

export function ChatNavigation() {
  const router = useRouter();
  const { reset } = useChatActions();
  const { isHome } = useChatInterface();
  const { tab } = useOverviewTab();

  const handleBack = () => {
    reset();
    // Preserve tab query parameter when navigating back
    const backPath = tab && tab !== "overview" ? `/?tab=${tab}` : "/";
    router.push(backPath);
  };

  if (isHome) return null;

  return (
    <div className="absolute left-0">
      <Button type="button" onClick={handleBack} variant="outline" size="icon">
        <ArrowLeft className="w-4 h-4" />
      </Button>
    </div>
  );
}
