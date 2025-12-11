"use client";

import { FilePreviewIcon } from "@/components/file-preview-icon";
import { useFileUrl } from "@/hooks/use-file-url";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  mimeType: string;
  filePath: string;
  lazy?: boolean;
  fixedSize?: { width: number; height: number };
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

export function FilePreview({
  mimeType,
  filePath,
  lazy = false,
  fixedSize,
}: Props) {
  // Determine endpoint based on mime type
  const endpoint = useMemo(() => {
    if (mimeType.startsWith("image/")) return "proxy";
    if (
      mimeType.startsWith("application/pdf") ||
      mimeType.startsWith("application/octet-stream")
    ) {
      return "preview";
    }
    return null;
  }, [mimeType]);

  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const {
    url: src,
    isLoading,
    hasFileKey,
  } = useFileUrl(
    endpoint === "preview"
      ? {
          type: "url",
          url: `/api/files/preview?filePath=vault/${filePath}`,
        }
      : endpoint
        ? {
            type: endpoint,
            filePath,
          }
        : null,
  );

  if (!endpoint) {
    return <FilePreviewIcon mimetype={mimeType} />;
  }

  // For local preview routes, hasFileKey is false (uses session auth)
  // For external API routes, we need hasFileKey to be true
  const isLocalPreview = endpoint === "preview";
  const needsFileKey = !isLocalPreview;

  if (isLoading || (needsFileKey && !hasFileKey) || !src) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Show skeleton while image is loading */}
      {imageLoading && !imageError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Show error preview if image fails to load */}
      {imageError && <ErrorPreview />}

      {/* Next.js Image - only render when not in error state */}
      {!imageError && (
        <Image
          src={src}
          alt="File Preview"
          {...(fixedSize
            ? {
                width: fixedSize.width,
                height: fixedSize.height,
                sizes: `${fixedSize.width}px`,
                unoptimized: true, // Disable optimization for fixed-size thumbnails to avoid multiple variants
              }
            : {
                fill: true,
              })}
          className={cn(
            "object-contain border border-border dark:border-none",
            imageLoading ? "opacity-0" : "opacity-100",
          )}
          loading={lazy ? "lazy" : "eager"}
          priority={!lazy}
          fetchPriority={lazy ? "low" : "high"}
          onLoadingComplete={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      )}
    </div>
  );
}
