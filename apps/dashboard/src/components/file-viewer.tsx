"use client";

import { useAuthenticatedUrl } from "@/hooks/use-authenticated-url";
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
  // Automatically authenticate the URL if it's a file proxy/preview URL
  const needsAuth =
    url.includes("/files/proxy") || url.includes("/files/preview");
  const {
    url: authenticatedUrl,
    isLoading,
    error,
  } = useAuthenticatedUrl(needsAuth ? url : null);

  // Use authenticated URL if available, otherwise fall back to original URL
  const finalUrl = authenticatedUrl || url;

  // Show loading state while authenticating or if we don't have a final URL yet
  if ((needsAuth && isLoading) || !finalUrl) {
    return <Skeleton className="h-full w-full" />;
  }

  // Show error state if authentication failed
  if (needsAuth && error) {
    return (
      <div className="size-16">
        <FilePreviewIcon mimetype={mimeType} />
      </div>
    );
  }

  if (
    mimeType === "application/pdf" ||
    mimeType === "application/octet-stream"
  ) {
    return (
      <DynamicPdfViewer url={finalUrl} key={finalUrl} maxWidth={maxWidth} />
    );
  }

  if (mimeType?.startsWith("image/")) {
    return <DynamicImageViewer url={finalUrl} key={finalUrl} />;
  }

  return (
    <div className="size-16">
      <FilePreviewIcon mimetype={mimeType} />
    </div>
  );
}
