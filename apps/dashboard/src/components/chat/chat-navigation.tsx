"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useChatActions } from "@ai-sdk-tools/store";
import { Button } from "@midday/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function ChatNavigation() {
  const router = useRouter();
  const { reset } = useChatActions();
  const { isHome } = useChatInterface();

  const handleBack = () => {
    reset();
    router.push("/");
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
