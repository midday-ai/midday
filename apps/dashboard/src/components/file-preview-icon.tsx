"use client";

import { Icons } from "@midday/ui/icons";

type Props = {
  mimetype: string;
};

export function FilePreviewIcon({ mimetype }: Props) {
  switch (mimetype) {
    case "application/pdf":
    case "application/zip":
      return <Icons.FolderZip className="w-full h-full" />;
    default:
      return <Icons.Description className="w-full h-full" />;
  }
}
