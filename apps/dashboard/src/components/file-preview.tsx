"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { useEffect, useState } from "react";

type Props = {
  mimeType: string;
  filePath: string;
};

export function FilePreview({ mimeType, filePath }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  let src = "";

  if (mimeType.startsWith("image/")) {
    src = `/api/proxy?filePath=${filePath}`;
  }

  if (
    mimeType.startsWith("application/pdf") ||
    mimeType.startsWith("application/octet-stream")
  ) {
    // NOTE: Make a image from the pdf
    src = `/api/preview?filePath=${filePath}`;
  }

  useEffect(() => {
    if (src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoading(false);
      img.onerror = () => setIsLoading(false);
    }
  }, [src]);

  return (
    <div className="w-full h-full relative">
      {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
      <img
        src={src}
        alt="File Preview"
        className={cn(
          "w-full h-full object-contain",
          isLoading ? "opacity-0" : "opacity-100",
          "transition-opacity duration-100",
        )}
      />
    </div>
  );
}
