"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { cn } from "@midday/ui/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

enum FileType {
  Pdf = "application/pdf",
  Heic = "image/heic",
}

type Props = {
  type: FileType;
  name: string;
  className?: string;
  preview?: boolean;
  src: string;
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

export function FilePreview({ src, className, name, type, preview }: Props) {
  const [isLoaded, setLoaded] = useState(false);

  const handleOnLoaded = () => {
    setTimeout(() => {
      setLoaded(true);
    }, 150);
  };

  let content;

  if (type?.startsWith("image")) {
    content = (
      <div
        className={cn(
          "flex items-center justify-center w-[300px] h-[315px]",
          className
        )}
      >
        <img
          src={src}
          className="object-contain"
          alt={name}
          onLoad={handleOnLoaded}
        />
      </div>
    );
  }

  if (type === FileType.Pdf) {
    content = (
      <div className={cn("overflow-hidden w-[300px] h-[317px]", className)}>
        <iframe
          src={`${src}#toolbar=0`}
          className={cn("-ml-[3px] -mt-[3px] w-[305px] h-[327px]", className)}
          title={name}
          onLoad={handleOnLoaded}
        />
      </div>
    );
  }

  return (
    <div className={cn(className, "relative")}>
      {!preview && isLoaded && (
        <AnimatePresence>
          <div className="absolute bottom-2 left-2 flex space-x-2">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
            >
              <Button
                variant="secondary"
                className="w-[32px] h-[32px] bg-black/60 hover:bg-black"
                size="icon"
              >
                <Icons.OpenInFull />
              </Button>
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ delay: 0.04 }}
            >
              <Button
                variant="secondary"
                className="w-[32px] h-[32px] bg-black/60 hover:bg-black"
                size="icon"
              >
                <Icons.FileDownload />
              </Button>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      <Skeleton
        className={cn(
          "absolute top-0 left-0 z-50 pointer-events-none w-full h-full",
          isLoaded && "hidden"
        )}
      />
      <div
        className={cn("bg-primary/10 w-full h-full", !isLoaded && "opacity-0")}
      >
        {content}
      </div>
    </div>
  );
}
