"use client";

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
import dynamic from "next/dynamic";
import { useState } from "react";
import React from "react";

const Iframe = dynamic(() => import("./iframe").then((mod) => mod.Iframe), {
  ssr: false,
});

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
  delay?: number;
};

const RenderComponent = ({
  type,
  src,
  className,
  width,
  height,
  preview,
  onLoaded,
  setError,
  delay,
}: {
  type: FileType;
  src: string;
  className?: string;
  width: number;
  height: number;
  preview?: boolean;
  onLoaded: (loaded: boolean) => void;
  setError: (error: boolean) => void;
  delay?: number;
}) => {
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

  if (type === FileType.Pdf) {
    return (
      <Iframe
        src={src}
        key={src}
        width={width}
        height={height}
        onLoaded={handleOnLoaded}
        setError={setError}
        preview={preview}
        delay={delay}
      />
    );
  }

  return null;
};

const DownloadButton = ({ url }: { url: string }) => (
  <a href={url} download>
    <Button
      variant="secondary"
      className="w-[32px] h-[32px] bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black border"
      size="icon"
    >
      <Icons.FileDownload />
    </Button>
  </a>
);

const RenderButtons = ({
  preview,
  isLoaded,
  disableFullscreen,
  downloadUrl,
}: {
  preview: boolean;
  isLoaded: boolean;
  disableFullscreen: boolean;
  downloadUrl?: string;
}) => {
  if (preview || !isLoaded) return null;

  return (
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
          <DownloadButton url={downloadUrl} />
        </motion.div>
      )}
    </div>
  );
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
  delay,
  onLoaded,
}: Props) {
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  function handleLoaded() {
    setLoaded(true);
    onLoaded?.();
  }

  return (
    <Dialog>
      <div
        className={cn(className, "relative h-full overflow-hidden")}
        style={preview ? { width: width - 2, height: height - 5 } : undefined}
      >
        {!isLoaded && !error && (
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <Skeleton
              style={{ width, height }}
              className={cn(
                isLoaded && "hidden",
                error && "hidden",
                isFullscreen &&
                  "absolute top-0 left-0 z-20 pointer-events-none w-full h-full",
              )}
            />
          </div>
        )}

        <div
          className={cn(
            "w-full h-full items-center flex justify-center bg-[#F2F1EF] dark:bg-secondary",
            !isLoaded && "hidden",
            error && "visible bg-transparent",
          )}
        >
          <AnimatePresence>
            <RenderButtons
              preview={preview}
              isLoaded={isLoaded}
              disableFullscreen={disableFullscreen}
              downloadUrl={downloadUrl}
            />
            {disableFullscreen && download && downloadUrl && (
              <div className="absolute bottom-4 left-2 z-10">
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  transition={{ delay: 0.04 }}
                >
                  <DownloadButton url={downloadUrl} />
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
              onLoaded={handleLoaded}
              setError={setError}
              preview={preview}
              delay={delay}
            />
          )}
        </div>
      </div>

      <DialogContentFrameless className="w-[680px] h-[800px] overflow-auto p-0 m-0">
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
