"use client";

import { useFileUrl } from "@/hooks/use-file-url";
import { Skeleton } from "@midday/ui/skeleton";
import dynamic from "next/dynamic";
import { FilePreviewIcon } from "./file-preview-icon";

const DynamicImageViewer = dynamic(
  () => import("@/components/image-viewer").then((mod) => mod.ImageViewer),
  { loading: () => <Skeleton className="h-full w-full" /> },
);

const DynamicPdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer),
  { loading: () => <Skeleton className="h-full w-full" /> },
);

type Props = {
  mimeType: string | null;
  url: string;
  maxWidth?: number;
};

export function FileViewer({ mimeType, url, maxWidth }: Props) {
  // Automatically add fileKey if it's a file proxy URL
  // Local dashboard preview endpoint doesn't need fileKey (uses session)
  const needsAuth = url.includes("/files/proxy");

  // Check if it's the local dashboard preview endpoint (returns PNG images)
  const isLocalPreview = url.includes("/api/files/preview");

  const {
    url: finalUrl,
    isLoading,
    hasFileKey,
  } = useFileUrl(
    needsAuth && !isLocalPreview
      ? {
          type: "url",
          url,
        }
      : null,
  );

  // Show loading state if we need auth but don't have fileKey yet
  if (needsAuth && !isLocalPreview && (isLoading || !hasFileKey)) {
    return <Skeleton className="h-full w-full" />;
  }

  const displayUrl = finalUrl || url;

  // Local preview endpoint returns PNG images, not PDFs
  const isPreviewImage = isLocalPreview;

  if (
    (mimeType === "application/pdf" ||
      mimeType === "application/octet-stream") &&
    !isPreviewImage
  ) {
    return (
      <DynamicPdfViewer url={displayUrl} key={displayUrl} maxWidth={maxWidth} />
    );
  }

  if (mimeType?.startsWith("image/") || isPreviewImage) {
    return <DynamicImageViewer url={displayUrl} key={displayUrl} />;
  }

  return (
    <div className="size-16">
      <FilePreviewIcon mimetype={mimeType} />
    </div>
  );
}
