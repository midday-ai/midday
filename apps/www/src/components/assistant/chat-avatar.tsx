"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";

type Props = {
  role: "assistant" | "user";
};

export function ChatAvatar({ role }: Props) {
  switch (role) {
    case "user": {
      return (
        <Avatar className="size-6">
          <AvatarImage src="https://cdn.dribbble.com/userupload/9743014/file/original-18fd8ddceb88a5a45fb6c934376e0d08.png?resize=1024x1024" />
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
