"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useImageLoadState } from "@/hooks/use-image-load-state";

function ErrorImage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Icons.BrokenImage className="size-8" />
        <p className="text-sm">File not found</p>
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
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={2}
          doubleClick={{ mode: "toggle", step: 1 }}
          panning={{ disabled: false }}
          wheel={{ wheelDisabled: true, touchPadDisabled: false, step: 0.5 }}
          pinch={{ step: 5 }}
          alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
            }}
            contentStyle={{
              cursor: "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
            }}
            wrapperClass="[&:active]:cursor-grabbing"
          >
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
          </TransformComponent>
        </TransformWrapper>
      )}
    </div>
  );
}
