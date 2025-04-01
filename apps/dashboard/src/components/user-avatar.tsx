"use client";

import { useTRPC } from "@/trpc/client";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AvatarUpload } from "./avatar-upload";

export function UserAvatar() {
  const trpc = useTRPC();

  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

  return (
    <Card>
      <div className="flex justify-between items-center pr-6">
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            This is your avatar. Click on the avatar to upload a custom one from
            your files.
          </CardDescription>
        </CardHeader>

        <AvatarUpload userId={user.id} avatarUrl={user.avatar_url} />
      </div>
      <CardFooter>An avatar is optional but strongly recommended.</CardFooter>
    </Card>
  );
}
