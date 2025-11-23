"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { AnimatePresence, motion } from "framer-motion";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { OpenURL } from "./open-url";

interface WebSearchSource {
  title?: string;
  url?: string;
  domain?: string;
}

export type WebSearchSourcesProps = ComponentProps<"div"> & {
  sources: WebSearchSource[];
  showSourceCount?: boolean;
};

function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export const WebSearchSources = ({
  sources: providedSources,
  showSourceCount = true,
  className,
}: WebSearchSourcesProps) => {
  const [animatedSources, setAnimatedSources] = useState<WebSearchSource[]>([]);

  // Animate in sources as they become available
  useEffect(() => {
    if (!providedSources?.length) {
      setAnimatedSources([]);
      return;
    }

    // Add sources one by one with a delay
    providedSources.forEach((source, index) => {
      setTimeout(() => {
        setAnimatedSources((prev) => {
          // Only add if not already present
          if (prev.some((s) => s.url === source.url)) {
            return prev;
          }
          return [...prev, source];
        });
      }, index * 150); // 150ms delay between each source
    });
  }, [providedSources]);

  if (!providedSources?.length) {
    return null;
  }

  return (
    <motion.div
      className={cn("mt-3", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center -space-x-2">
          <AnimatePresence mode="popLayout">
            {animatedSources.map((source, index) => (
              <WebSearchSourceAvatar
                key={source.url}
                source={source}
                zIndex={animatedSources.length - index}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
        <motion.div
          className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <span className="text-xs text-muted-foreground font-medium">
            Sources
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <motion.span
            className="text-xs text-muted-foreground"
            key={animatedSources.length}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {animatedSources.length}
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
};

interface WebSearchSourceAvatarProps {
  source: WebSearchSource;
  zIndex?: number;
  index?: number;
}

const WebSearchSourceAvatar = ({
  source,
  zIndex = 0,
  index = 0,
}: WebSearchSourceAvatarProps) => {
  const domain = source.domain || extractDomainFromUrl(source.url || "");

  if (!source.url) {
    return null;
  }

  return (
    <OpenURL href={source.url}>
      <motion.div
        className="inline-flex cursor-pointer"
        style={{ zIndex }}
        initial={{ opacity: 0, scale: 0, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0, x: -20 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.95 }}
      >
        <Avatar className="h-5 w-5 cursor-pointer border-2 border-background shadow-sm">
          <AvatarImage
            src={`https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=64&retina=true`}
            alt={`${domain} logo`}
          />
          <AvatarFallback className="text-[10px] bg-background text-muted-foreground font-medium">
            {domain.split(".")[0]?.charAt(0).toUpperCase() || ""}
          </AvatarFallback>
        </Avatar>
      </motion.div>
    </OpenURL>
  );
};
