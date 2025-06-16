"use client";

import { useUserQuery } from "@/hooks/use-user";
import { Avatar, AvatarImageNext } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";
import type { UIMessage } from "ai";

type Props = {
  role: UIMessage["role"];
};

export function ChatAvatar({ role }: Props) {
  const { data: user } = useUserQuery();

  switch (role) {
    case "user": {
      return (
        <div className="flex size-[25px] shrink-0 select-none items-center justify-center">
          <Avatar className="size-6">
            <AvatarImageNext
              src={user?.avatarUrl || ""}
              alt={user?.fullName ?? ""}
              width={24}
              height={24}
            />
          </Avatar>
        </div>
      );
    }

    case "assistant": {
      return (
        <div className="flex size-[25px] shrink-0 select-none items-center justify-center">
          <Icons.LogoSmall className="size-6" />
        </div>
      );
    }

    default:
      return null;
  }
}
