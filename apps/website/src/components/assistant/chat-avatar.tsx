"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";

type Props = {
  role: "assistant" | "user";
};

export function ChatAvatar({ role }: Props) {
  switch (role) {
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
