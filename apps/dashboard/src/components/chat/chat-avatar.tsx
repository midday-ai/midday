"use client";

import type { AI } from "@/actions/ai/chat";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { useAIState } from "ai/rsc";

type Props = {
  role: "assistant" | "user";
};
export function ChatAvatar({ role }: Props) {
  const [aiState] = useAIState<typeof AI>();

  switch (role) {
    case "user": {
      return (
        <Avatar className="size-6">
          <AvatarImage
            src={aiState?.user?.avatar_url}
            alt={aiState?.user?.full_name ?? ""}
          />
        </Avatar>
      );
    }

    default:
      return (
        <Avatar className="size-6">
          <AvatarImage src="https://cdn.dribbble.com/userupload/9743014/file/original-18fd8ddceb88a5a45fb6c934376e0d08.png?resize=1024x1024" />
        </Avatar>
      );
  }
}
