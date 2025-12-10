"use client";

import { useImageLoadState } from "@/hooks/use-image-load-state";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";

function ErrorImage() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-primary/10">
      <div className="flex flex-col items-center justify-center">
        <Icons.BrokenImage className="size-4" />
      </div>
    </div>
  );
}

export function ImageViewer({ url }: { url: string }) {
  const { isLoading, isError, imgRef, handleLoad, handleError } =
    useImageLoadState(url);

  if (!url) return <ErrorImage />;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-primary/10">
      {isLoading && !isError && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}

      {isError && <ErrorImage />}

      {!isError && (
        <img
          ref={imgRef}
          src={url}
          alt="Viewer content"
          className={cn(
            "max-h-full max-w-full object-contain",
            isLoading ? "opacity-0" : "opacity-100",
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
