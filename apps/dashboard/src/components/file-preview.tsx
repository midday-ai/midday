"use client";

import { FilePreviewIcon } from "@/components/file-preview-icon";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { useEffect, useState } from "react";

type Props = {
  mimeType: string;
  filePath: string;
};

function ErrorPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-primary/10">
      <div className="flex flex-col items-center justify-center">
        <Icons.BrokenImage className="size-4" />
      </div>
    </div>
  );
}

export function FilePreview({ mimeType, filePath }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  let src = null;

  if (mimeType.startsWith("image/")) {
    src = `/api/proxy?filePath=${encodeURIComponent(filePath)}`;
  }

  if (
    mimeType.startsWith("application/pdf") ||
    mimeType.startsWith("application/octet-stream")
  ) {
    // NOTE: Make a image from the pdf
    src = `/api/preview?filePath=${encodeURIComponent(filePath)}`;
  }

  useEffect(() => {
    if (src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setIsLoading(false);
        setIsError(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setIsError(true);
      };
    }
  }, [src]);

  if (!src) {
    return <FilePreviewIcon mimetype={mimeType} />;
  }

  if (isError) {
    return <ErrorPreview />;
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}

      <img
        src={src}
        alt="File Preview"
        className={cn(
          "w-full h-full object-contain border border-border dark:border-none",
          isLoading ? "opacity-0" : "opacity-100",
          "transition-opacity duration-100",
        )}
        onError={() => setIsError(true)}
      />
    </div>
  );
}
