"use client";

import { Button } from "@midday/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { cn } from "@midday/ui/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export enum FileType {
  Pdf = "application/pdf",
  Heic = "image/heic",
}

type Props = {
  type: FileType;
  name: string;
  className?: string;
  preview?: boolean;
  src: string;
  downloadUrl?: string;
  width: number;
  height: number;
  disableFullscreen?: boolean;
  onLoaded?: () => void;
};

export const isSupportedFilePreview = (type: FileType) => {
  if (!type) {
    return false;
  }

  if (type === FileType.Heic) {
    return false;
  }

  if (type?.startsWith("image")) {
    return true;
  }

  switch (type) {
    case FileType.Pdf:
      return true;
    default:
      return false;
  }
};

const RenderComponent = ({
  type,
  src,
  className,
  width,
  height,
  onLoaded,
  setError,
}) => {
  const [numPages, setNumPages] = useState<number>(0);

  const onDocumentLoadSuccess = ({
    numPages: nextNumPages,
  }: {
    numPages: number;
  }) => {
    onLoaded(true);
    setNumPages(nextNumPages);
  };

  const handleOnLoaded = () => {
    onLoaded(true);
  };

  if (type?.startsWith("image")) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <img
          src={src}
          className="object-contain"
          alt="Preview"
          onError={() => setError(true)}
          onLoad={handleOnLoaded}
        />
      </div>
    );
  }

  switch (type) {
    case FileType.Pdf:
      return (
        <div style={{ width, height }} className="pdf-viewer">
          <Document file={src} onLoadSuccess={onDocumentLoadSuccess}>
            <div className="overflow-auto" style={{ height }}>
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={width}
                />
              ))}
            </div>
          </Document>
        </div>
      );
    default:
      return null;
  }
};

export function FilePreview({
  src,
  className,
  name,
  type,
  preview,
  downloadUrl,
  width,
  height,
  disableFullscreen,
  onLoaded,
}: Props) {
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <Dialog>
      <div className={cn(className, "relative")}>
        {!preview && isLoaded && (
          <AnimatePresence>
            <div className="absolute bottom-4 left-2 flex space-x-2 z-10">
              {!disableFullscreen && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      className="w-[32px] h-[32px] bg-black/60 hover:bg-black"
                      size="icon"
                    >
                      <Icons.OpenInFull />
                    </Button>
                  </DialogTrigger>
                </motion.div>
              )}
              {downloadUrl && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  transition={{ delay: 0.04 }}
                >
                  <a href={downloadUrl} download>
                    <Button
                      variant="secondary"
                      className="w-[32px] h-[32px] bg-black/60 hover:bg-black"
                      size="icon"
                    >
                      <Icons.FileDownload />
                    </Button>
                  </a>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        )}

        <Skeleton
          className={cn(
            "absolute top-0 left-0 z-20 pointer-events-none w-full h-full rounded-none",
            isLoaded && "hidden",
            error && "hidden"
          )}
        />
        <div
          className={cn(
            "bg-primary/10 w-full h-full items-center flex justify-center",
            !isLoaded && "opacity-0",
            error && "opacity-1 bg-transparent"
          )}
        >
          {error ? (
            <Icons.Image size={16} />
          ) : (
            <RenderComponent
              type={type}
              src={src}
              className={className}
              width={width}
              height={height}
              onLoaded={() => {
                setLoaded(true);
                onLoaded?.();
              }}
              setError={setError}
            />
          )}
        </div>
      </div>

      <DialogContent className="p-0 max-w-[680px]">
        <FilePreview
          src={src}
          name={name}
          type={type}
          downloadUrl={downloadUrl}
          width={680}
          height={780}
          disableFullscreen
        />
      </DialogContent>
    </Dialog>
  );
}
