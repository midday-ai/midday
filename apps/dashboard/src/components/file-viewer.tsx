"use client";

import { Skeleton } from "@midday/ui/skeleton";
import dynamic from "next/dynamic";
import { useFileUrl } from "@/hooks/use-file-url";
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
  const needsAuth = url.includes("/files/proxy");

  const {
    url: finalUrl,
    isLoading,
    hasFileKey,
  } = useFileUrl(
    needsAuth
      ? {
          type: "url",
          url,
        }
      : null,
  );

  if (needsAuth && (isLoading || !hasFileKey)) {
    return <Skeleton className="h-full w-full" />;
  }

  const displayUrl = finalUrl || url;

  if (
    mimeType === "application/pdf" ||
    mimeType === "application/octet-stream"
  ) {
    return (
      <DynamicPdfViewer url={displayUrl} key={displayUrl} maxWidth={maxWidth} />
    );
  }

  if (mimeType?.startsWith("image/")) {
    return <DynamicImageViewer url={displayUrl} key={displayUrl} />;
  }

  return (
    <div className="size-16">
      <FilePreviewIcon mimetype={mimeType} />
    </div>
  );
}
