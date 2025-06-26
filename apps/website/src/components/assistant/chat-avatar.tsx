"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";

type Props = {
  type: "assistant" | "user";
};

export function ChatAvatar({ type = "assistant" }: Props) {
  switch (type) {
    case "user": {
      return (
        <Avatar className="size-6">
          <AvatarImage src="https://pbs.twimg.com/profile_images/1755611130368770048/JwLEqyeo_400x400.jpg" />
        </Avatar>
      );
    }

    default:
      return <Icons.LogoSmall className="size-6" />;
  }
}
