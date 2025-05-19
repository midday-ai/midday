"use client";

import { useUserQuery } from "@/hooks/use-user";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { AvatarUpload } from "./avatar-upload";

export function UserAvatar() {
  const { data: user } = useUserQuery();

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

        <AvatarUpload userId={user?.id} avatarUrl={user?.avatarUrl} />
      </div>
      <CardFooter>An avatar is optional but strongly recommended.</CardFooter>
    </Card>
  );
}
