"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useChatActions } from "@ai-sdk-tools/store";
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
    <div className="absolute left-4">
      <button
        type="button"
        onClick={handleBack}
        className="p-2 hover:bg-accent transition-colors"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
