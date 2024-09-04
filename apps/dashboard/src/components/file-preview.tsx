"use client";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContentFrameless,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { FileType } from "@midday/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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
  download?: boolean;
  isFullscreen?: boolean;
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
    // NOTE: Can't get initial onLoad event to fire
    onLoaded(true);

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
        <Document file={src} onLoadSuccess={onDocumentLoadSuccess}>
          <div
            className="overflow-y-auto overflow-x-hidden max-h-screen"
            style={{ width: width, height: height }}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={width}
                height={height}
              />
            ))}
          </div>
        </Document>
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
  download = true,
  isFullscreen,
  onLoaded,
}: Props) {
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <Dialog>
      <div className={cn(className, "relative h-full overflow-hidden")}>
        <div
          className={cn(
            "w-full h-full flex items-center justify-center pointer-events-none",
            isLoaded && "hidden",
            error && "hidden",
          )}
        >
          <Skeleton
            style={{ width: width, height: height }}
            className={cn(
              isLoaded && "hidden",
              error && "hidden",
              isFullscreen &&
                "absolute top-0 left-0 z-20 pointer-events-none w-full h-full",
            )}
          />
        </div>

        <div
          className={cn(
            "w-full h-full items-center flex justify-center bg-[#F2F1EF] dark:bg-secondary",
            !isLoaded && "hidden",
            error && "visible bg-transparent",
          )}
        >
          <AnimatePresence>
            {!preview && isLoaded && (
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
                        className="w-[32px] h-[32px] bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black border"
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
                        className="w-[32px] h-[32px] bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black border"
                        size="icon"
                      >
                        <Icons.FileDownload />
                      </Button>
                    </a>
                  </motion.div>
                )}
              </div>
            )}

            {disableFullscreen && download && downloadUrl && (
              <div className="absolute bottom-4 left-2 z-10">
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  transition={{ delay: 0.04 }}
                >
                  <a href={downloadUrl} download>
                    <Button
                      variant="secondary"
                      className="w-[32px] h-[32px] bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black border"
                      size="icon"
                    >
                      <Icons.FileDownload />
                    </Button>
                  </a>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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

      <DialogContentFrameless className="max-w-[680px] max-h-[800px] overflow-auto p-0 m-0">
        <FilePreview
          src={src}
          name={name}
          type={type}
          downloadUrl={downloadUrl}
          width={680}
          height={780}
          disableFullscreen
        />
      </DialogContentFrameless>
    </Dialog>
  );
}
