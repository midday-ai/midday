"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookIcon } from "lucide-react";

interface SourceItem {
  url: string;
  title: string;
}

interface FaviconStackProps {
  sources: SourceItem[];
}

/**
 * Get favicon URL for a given website URL
 */
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return "";
  }
}

export function FaviconStack({ sources }: FaviconStackProps) {
  if (sources.length === 0) return null;

  return (
    <div className="flex items-center not-prose mb-4">
      <div className="flex items-center">
        <AnimatePresence mode="popLayout">
          {sources.map((source, index) => (
            <motion.a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              initial={{
                opacity: 0,
                scale: 0.6,
                x: 50,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                filter: "blur(0px)",
                zIndex: sources.length - index,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: -20,
                filter: "blur(4px)",
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.04,
                ease: [0.16, 1, 0.3, 1], // Custom easing for smooth motion
              }}
              className="relative group -ml-2 first:ml-0"
              style={{ zIndex: sources.length - index }}
            >
              <div className="relative w-5 h-5 rounded-full bg-background border-2 border-border overflow-hidden flex items-center justify-center shadow-sm">
                <img
                  src={getFaviconUrl(source.url)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide image and show fallback icon
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    const fallback = parent?.querySelector(
                      ".fallback-icon",
                    ) as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
                <BookIcon
                  className="fallback-icon w-3 h-3 hidden text-muted-foreground"
                  style={{ display: "none" }}
                />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {source.title}
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      {sources.length > 0 && (
        <span className="text-xs text-muted-foreground ml-2">
          {sources.length} {sources.length === 1 ? "source" : "sources"}
        </span>
      )}
    </div>
  );
}
