"use client";

import { updateTeamAction } from "@/actions/update-team-action";
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
import { useAction } from "next-safe-action/hooks";
import { useRef } from "react";

export function TeamAvatar({ teamId, logoUrl, name }) {
  const action = useAction(updateTeamAction);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading, uploadFile } = useUpload();

  const handleUpload = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = evt.target;
    const selectedFile = files as FileList;

    const filename = stripSpecialCharacters(selectedFile[0]?.name);

    const { url } = await uploadFile({
      bucket: "avatars",
      path: [teamId, filename],
      file: selectedFile[0] as File,
    });

    if (url) {
      action.execute({ logo_url: url, revalidatePath: "/settings" });
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
                src={logoUrl}
                alt={name}
                width={64}
                height={64}
                quality={100}
              />
              <AvatarFallback>
                <span className="text-md">{name?.charAt(0)}</span>
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
