"use client";

import { Skeleton } from "@midday/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { pdfjs } from "react-pdf";
import { FilePreviewIcon } from "@/components/file-preview-icon";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Module-level thumbnail cache (persists across navigations)
const thumbnailCache = new Map<string, string>();

// Render queue to limit concurrent PDF renders
const CONCURRENT_LIMIT = 3;
let activeRenders = 0;
const renderQueue: Array<{ fn: () => void; key: string }> = [];

function enqueueRender(key: string, fn: () => void) {
  if (activeRenders < CONCURRENT_LIMIT) {
    activeRenders++;
    fn();
  } else {
    renderQueue.push({ fn, key });
  }
}

function dequeueRender() {
  activeRenders--;
  const next = renderQueue.shift();
  if (next) {
    activeRenders++;
    next.fn();
  }
}

function removeFromQueue(key: string) {
  const idx = renderQueue.findIndex((item) => item.key === key);
  if (idx !== -1) renderQueue.splice(idx, 1);
}

/** Convert canvas to a blob URL (async, low memory) with fallback to dataURL */
function canvasToUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          }
        },
        "image/jpeg",
        0.85,
      );
    } else {
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    }
  });
}

type Props = {
  url: string;
  cacheKey: string;
  width?: number;
  height?: number;
};

export function PdfThumbnail({ url, cacheKey, width = 60, height }: Props) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(
    () => thumbnailCache.get(cacheKey) ?? null,
  );
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const urlRef = useRef(url);
  urlRef.current = url;

  // Intersection observer -- only render when visible
  useEffect(() => {
    if (thumbnailSrc) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [thumbnailSrc]);

  // Render PDF when visible
  useEffect(() => {
    if (!isVisible || thumbnailSrc || error) return;

    abortRef.current = false;

    enqueueRender(cacheKey, () => {
      if (abortRef.current) {
        dequeueRender();
        return;
      }

      const cached = thumbnailCache.get(cacheKey);
      if (cached) {
        setThumbnailSrc(cached);
        dequeueRender();
        return;
      }

      pdfjs
        .getDocument(urlRef.current)
        .promise.then(async (pdf) => {
          if (abortRef.current) {
            pdf.destroy();
            dequeueRender();
            return;
          }

          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1 });
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const scale = (width * dpr) / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            setError(true);
            pdf.destroy();
            dequeueRender();
            return;
          }

          await page.render({
            canvasContext: ctx,
            viewport: scaledViewport,
            canvas,
          }).promise;

          if (abortRef.current) {
            pdf.destroy();
            dequeueRender();
            return;
          }

          // Use blob URL (async, low memory) instead of dataURL (sync, large string)
          const thumbUrl = await canvasToUrl(canvas);
          thumbnailCache.set(cacheKey, thumbUrl);
          setThumbnailSrc(thumbUrl);

          // Free memory
          pdf.destroy();
          canvas.width = 0;
          canvas.height = 0;

          dequeueRender();
        })
        .catch(() => {
          if (!abortRef.current) {
            setError(true);
          }
          dequeueRender();
        });
    });

    return () => {
      abortRef.current = true;
      removeFromQueue(cacheKey);
    };
  }, [cacheKey, isVisible, thumbnailSrc, error, width]);

  if (error) {
    return <FilePreviewIcon mimetype="application/pdf" />;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt="PDF preview"
          width={width}
          height={height}
          className="object-cover object-top border border-border dark:border-none w-full h-full"
        />
      ) : (
        <Skeleton className="w-full h-full" />
      )}
    </div>
  );
}
