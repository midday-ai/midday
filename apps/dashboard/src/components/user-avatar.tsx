"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { AvatarUpload } from "./avatar-upload";

type Props = {
  userId: string;
  avatarUrl: string;
  fullName: string;
};

export function UserAvatar({ userId, avatarUrl, fullName }: Props) {
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

        <AvatarUpload
          userId={userId}
          avatarUrl={avatarUrl}
          fullName={fullName}
        />
      </div>
      <CardFooter>An avatar is optional but strongly recommended.</CardFooter>
    </Card>
  );
}
