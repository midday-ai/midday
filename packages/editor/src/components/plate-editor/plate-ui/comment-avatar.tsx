"use client";

import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/plate-editor/plate-ui/avatar";
import { useUserById } from "@udecode/plate-comments";

export function CommentAvatar({ userId }: { userId: string | null }) {
  const user = useUserById(userId);
  if (!user) return null;

  return (
    <Avatar className="size-5">
      <AvatarImage src={user.avatarUrl} alt={user.name} />
      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
    </Avatar>
  );
}
