"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { useState } from "react";

function ErrorImage() {
  return (
    <div className="absolute inset-0 h-full w-full items-center justify-center bg-primary/10">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <Icons.BrokenImage className="h-6" />
      </div>
    </div>
  );
}

export function ImageViewer({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  if (!url) return <ErrorImage />;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-primary/10">
      {isLoading && !isError && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}

      {isError && <ErrorImage />}

      <img
        src={url}
        alt="Viewer content"
        className={cn(
          "max-h-full max-w-full object-contain",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsError(true)}
      />
    </div>
  );
}
