"use client";

import { useUpload } from "@/hooks/use-upload";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Spinner } from "@midday/ui/spinner";
import { nanoid } from "nanoid";
import { useRef, useState } from "react";

type Props = {
  logoUrl?: string | null;
  onUpload?: (url: string) => void;
  size?: number;
};

export const LogoUpload = ({ logoUrl: initialLogoUrl, onUpload }: Props) => {
  const [logo, setLogo] = useState(initialLogoUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoading, uploadFile } = useUpload();

  const handleUpload = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = evt.target;
    const selectedFile = files as FileList;

    if (!selectedFile[0]) return;

    const originalFilename = selectedFile[0]?.name ?? "";
    const extension = originalFilename.split(".").pop() || "";
    const filename = extension ? `${nanoid()}.${extension}` : nanoid();

    const { url } = await uploadFile({
      bucket: "apps",
      path: ["logos", filename],
      file: selectedFile[0] as File,
    });

    if (url) {
      setLogo(url);
      onUpload?.(url);
    }
  };

  return (
    <Avatar
      className="rounded-none w-16 h-16 flex items-center justify-center bg-accent cursor-pointer"
      onClick={() => inputRef?.current?.click()}
    >
      {isLoading ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <>
          <AvatarImage
            src={logo ?? undefined}
            alt="Logo"
            width={64}
            height={64}
          />
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
  );
};
