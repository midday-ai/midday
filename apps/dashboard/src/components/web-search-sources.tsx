"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

interface WebSearchSource {
  title: string;
  url: string;
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

function extractSourcesFromToolOutput(toolOutput: any): WebSearchSource[] {
  // Try to extract sources from different possible structures
  const sources: WebSearchSource[] = [];

  // If tool output is just a status, the sources might be elsewhere
  if (
    toolOutput &&
    typeof toolOutput === "object" &&
    toolOutput.status === "completed"
  ) {
    return sources; // Return empty for now, sources might be in text content
  }

  // Handle OpenAI web search preview tool output structure
  if (toolOutput?.sources && Array.isArray(toolOutput.sources)) {
    // Direct sources array
    return toolOutput.sources.map((source: any) => {
      const domain = extractDomainFromUrl(source.url || "");
      return {
        title: source.title || source.name || domain,
        url: source.url || "",
        domain,
      };
    });
  }

  if (toolOutput?.references && Array.isArray(toolOutput.references)) {
    // References array
    return toolOutput.references.map((ref: any) => {
      const domain = extractDomainFromUrl(ref.url || "");
      return {
        title: ref.title || ref.name || domain,
        url: ref.url || "",
        domain,
      };
    });
  }

  // Handle case where sources might be in the content property
  if (toolOutput?.content) {
    if (typeof toolOutput.content === "object" && toolOutput.content.sources) {
      return extractSourcesFromToolOutput(toolOutput.content);
    }

    if (typeof toolOutput.content === "string") {
      // Try to extract URLs from text content
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const urls = toolOutput.content.match(urlRegex) || [];

      return urls.map((url: string) => ({
        title: extractDomainFromUrl(url),
        url: url,
        domain: extractDomainFromUrl(url),
      }));
    }
  }

  if (typeof toolOutput === "string") {
    // Try to extract URLs from text content with better patterns
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const urls = toolOutput.match(urlRegex) || [];

    // Also try to extract markdown-style links [title](url)
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const markdownLinks = [...toolOutput.matchAll(markdownLinkRegex)];

    const sources: WebSearchSource[] = [];

    // Add markdown links first (they have titles)
    for (const match of markdownLinks) {
      const title = match[1];
      const url = match[2];
      if (title && url) {
        const domain = extractDomainFromUrl(url);
        sources.push({
          title: title,
          url: url,
          domain,
        });
      }
    }

    // Add plain URLs that weren't already captured
    for (const url of urls) {
      const cleanUrl = url.replace(/[.,;!?]*$/, ""); // Remove trailing punctuation
      if (!sources.some((s) => s.url === cleanUrl)) {
        const domain = extractDomainFromUrl(cleanUrl);
        sources.push({
          title: domain,
          url: cleanUrl,
          domain,
        });
      }
    }

    return sources;
  }

  return sources;
}

export const WebSearchSources = ({
  sources: providedSources,
  showSourceCount = true,
  className,
  ...props
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
      <TooltipProvider>
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
      </TooltipProvider>
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
  const domain = source.domain || extractDomainFromUrl(source.url);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
          onClick={() =>
            window.open(source.url, "_blank", "noopener,noreferrer")
          }
        >
          <Avatar className="h-5 w-5 cursor-pointer border-2 border-background shadow-sm">
            <AvatarImage
              src={`https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=64&retina=true`}
              alt={`${domain} logo`}
              onError={(e) => {
                // Fallback to a simple domain favicon if Logo.dev fails
                (e.target as HTMLImageElement).src =
                  `https://${domain}/favicon.ico`;
              }}
            />
            <AvatarFallback className="text-[10px] bg-background text-muted-foreground font-medium">
              {domain.split(".")[0]?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium text-sm">{source.title}</p>
          <p className="text-xs text-muted-foreground">{domain}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Helper function to extract sources from web search tool output
export const extractWebSearchSources = (toolOutput: any): WebSearchSource[] => {
  return extractSourcesFromToolOutput(toolOutput);
};
