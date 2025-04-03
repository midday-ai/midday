"use client";

import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useUpload } from "@/hooks/use-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { stripSpecialCharacters } from "@midday/utils";
import { Loader2 } from "lucide-react";
import { useRef } from "react";

export function TeamAvatar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading, uploadFile } = useUpload();
  const { data } = useTeamQuery();
  const { mutate: updateTeam } = useTeamMutation();

  const handleUpload = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = evt.target;
    const selectedFile = files as FileList;

    const filename = stripSpecialCharacters(selectedFile[0]?.name);

    const { url } = await uploadFile({
      bucket: "avatars",
      path: [data?.id, filename],
      file: selectedFile[0] as File,
    });

    if (url) {
      updateTeam({ logo_url: url });
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center pr-6">
        <CardHeader>
          <CardTitle>Team Avatar</CardTitle>
          <CardDescription>
            This is your team's avatar. Click on the avatar to upload a custom
            one from your files.
          </CardDescription>
        </CardHeader>

        <Avatar
          className="rounded-full w-16 h-16 flex items-center justify-center bg-accent cursor-pointer"
          onClick={() => inputRef?.current?.click()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <AvatarImage
                src={data?.logo_url ?? undefined}
                alt={data?.name ?? undefined}
                width={64}
                height={64}
              />
              <AvatarFallback>
                <span className="text-md">{data?.name?.charAt(0)}</span>
              </AvatarFallback>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
            multiple={false}
            onChange={handleUpload}
          />
        </Avatar>
      </div>
      <CardFooter>An avatar is optional but strongly recommended.</CardFooter>
    </Card>
  );
}
