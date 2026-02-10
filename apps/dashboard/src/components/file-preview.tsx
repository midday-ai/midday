"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { FilePreviewIcon } from "@/components/file-preview-icon";
import { useFileUrl } from "@/hooks/use-file-url";

const PdfThumbnail = dynamic(
  () => import("@/components/pdf-thumbnail").then((mod) => mod.PdfThumbnail),
  { ssr: false },
);

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
  const isPdf =
    mimeType.startsWith("application/pdf") ||
    mimeType.startsWith("application/octet-stream");
  const isImage = mimeType.startsWith("image/");

  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Get authenticated URL for both images and PDFs
  const {
    url: src,
    isLoading,
    hasFileKey,
  } = useFileUrl(
    isPdf || isImage
      ? {
          type: "proxy",
          filePath: `vault/${filePath}`,
        }
      : null,
  );

  // PDF thumbnails - rendered client-side
  if (isPdf) {
    if (isLoading || !hasFileKey || !src) {
      return <Skeleton className="w-full h-full" />;
    }

    return (
      <PdfThumbnail
        url={src}
        cacheKey={filePath}
        width={fixedSize?.width ?? 60}
        height={fixedSize?.height}
      />
    );
  }

  // Non-image, non-PDF files
  if (!isImage) {
    return <FilePreviewIcon mimetype={mimeType} />;
  }

  // Images
  if (isLoading || !hasFileKey || !src) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {imageLoading && !imageError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {imageError && <ErrorPreview />}

      {!imageError && (
        <Image
          src={src}
          alt="File Preview"
          {...(fixedSize
            ? {
                width: fixedSize.width,
                height: fixedSize.height,
                sizes: `${fixedSize.width}px`,
                unoptimized: true,
              }
            : {
                fill: true,
              })}
          className={cn(
            "object-cover object-top border border-border dark:border-none w-full h-full",
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
