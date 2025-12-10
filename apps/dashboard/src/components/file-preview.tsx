"use client";

import { FilePreviewIcon } from "@/components/file-preview-icon";
import { useAuthenticatedUrl } from "@/hooks/use-authenticated-url";
import { useImageLoadState } from "@/hooks/use-image-load-state";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { useMemo } from "react";

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
  // Determine endpoint based on mime type
  const endpoint = mimeType.startsWith("image/")
    ? "proxy"
    : mimeType.startsWith("application/pdf") ||
        mimeType.startsWith("application/octet-stream")
      ? "preview"
      : null;

  const baseUrl = useMemo(() => {
    if (!endpoint) return null;
    return `${process.env.NEXT_PUBLIC_API_URL}/files/${endpoint}?filePath=${encodeURIComponent(filePath)}`;
  }, [endpoint, filePath]);

  const { url: src, error, isLoading } = useAuthenticatedUrl(baseUrl);
  const {
    isLoading: imageLoading,
    isError: imageError,
    imgRef,
    handleLoad,
    handleError,
  } = useImageLoadState(src);

  if (!endpoint) {
    return <FilePreviewIcon mimetype={mimeType} />;
  }

  if (error) {
    return <ErrorPreview />;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Show skeleton while authenticating URL or image is loading */}
      {(isLoading || !src || imageLoading) && !imageError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Show error preview if image fails to load */}
      {imageError && <ErrorPreview />}

      {/* Image - only render when not in error state */}
      {src && !imageError && (
        <img
          ref={imgRef}
          src={src}
          alt="File Preview"
          className={cn(
            "w-full h-full object-contain border border-border dark:border-none",
            imageLoading ? "opacity-0" : "opacity-100",
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
