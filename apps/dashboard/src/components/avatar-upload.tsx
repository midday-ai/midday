"use client";

import { updateUserAction } from "@/actions/update-user-action";
import { useUpload } from "@/hooks/use-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";
import { stripSpecialCharacters } from "@midday/utils";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { forwardRef } from "react";

type Props = {
  userId: string;
  avatarUrl?: string;
  fullName?: string;
  onUpload?: (url: string) => void;
  size?: number;
};

export const AvatarUpload = forwardRef<HTMLInputElement, Props>(
  (
    { userId, avatarUrl: initialAvatarUrl, fullName, size = 65, onUpload },
    ref,
  ) => {
    const action = useAction(updateUserAction);
    const [avatar, setAvatar] = useState(initialAvatarUrl);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isLoading, uploadFile } = useUpload();

    const handleUpload = async (evt: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = evt.target;
      const selectedFile = files as FileList;

      const filename = stripSpecialCharacters(selectedFile[0]?.name ?? "");

      const { url } = await uploadFile({
        bucket: "avatars",
        path: [userId, filename],
        file: selectedFile[0] as File,
      });

      if (url) {
        action.execute({ avatar_url: url });
        setAvatar(url);
        onUpload?.(url);
      }
    };

    const fileInputRef = ref || inputRef;

    return (
      <Avatar
        className="rounded-full flex items-center justify-center bg-accent cursor-pointer border border-border"
        style={{ width: size, height: size }}
        onClick={() => {
          if ("current" in fileInputRef && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <AvatarImage src={avatar} />
            <AvatarFallback>
              <Icons.AccountCircle className="size-5" />
            </AvatarFallback>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          multiple={false}
          onChange={handleUpload}
        />
      </Avatar>
    );
  },
);

AvatarUpload.displayName = "AvatarUpload";
