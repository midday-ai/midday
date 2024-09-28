import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { useEffect, useRef, useState } from "react";

export function Iframe({
  src,
  width,
  height,
  onLoaded,
  setError,
  preview,
  delay = 0,
}: {
  src: string;
  width: number;
  height: number;
  preview: boolean;
  delay?: number;
  onLoaded: (loaded: boolean) => void;
  setError: (error: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframe = iframeRef.current;

  useEffect(() => {
    if (!iframe) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          iframe.src = iframe.dataset.src as string;
          observer.unobserve(iframe);
        }
      },
      {
        threshold: 0,
      },
    );

    observer.observe(iframe);

    return () => {
      observer.disconnect();
    };
  }, [iframe]);

  useEffect(() => {
    setTimeout(() => {
      onLoaded(true);
    }, delay);
  }, [src]);

  return (
    <div className="overflow-hidden w-full h-full">
      <iframe
        ref={iframeRef}
        title="Preview"
        data-src={`${src}#toolbar=0&scrollbar=0`}
        width={width}
        height={height}
        allowFullScreen={false}
        loading="lazy"
        className={cn(
          "h-full w-full transition-opacity duration-100",
          isLoading && "opacity-0",
        )}
        style={{
          marginLeft: preview ? 0 : -8,
          marginTop: preview ? 0 : -8,
          width: preview ? width : "calc(100% + 16px)",
          height: preview ? height : "calc(100% + 16px)",
          overflow: "hidden",
        }}
        onLoad={() => {
          setTimeout(() => {
            setIsLoading(false);
          }, 200);
        }}
        onError={() => setError(true)}
      />

      <Skeleton
        className={cn("w-full h-full absolute", !isLoading && "hidden")}
      />
    </div>
  );
}
