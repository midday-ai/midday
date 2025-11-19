"use client";

import { useChatActions } from "@ai-sdk-tools/store";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";

export function NewChatButton() {
  const router = useRouter();
  const { reset } = useChatActions();

  const handleNewChat = () => {
    reset();
    router.push("/");
  };

  return (
    <Button
      type="button"
      onClick={handleNewChat}
      variant="outline"
      size="icon"
      title="New chat"
    >
      <Icons.Add size={16} />
    </Button>
  );
}
