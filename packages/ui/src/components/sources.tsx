"use client";

import { BookIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

export type SourcesProps = ComponentProps<"div">;

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Collapsible
    className={cn("not-prose mb-4 text-primary text-xs", className)}
    {...props}
  />
);

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <CollapsibleTrigger
    className={cn("flex items-center gap-2", className)}
    {...props}
  >
    {children ?? (
      <>
        <p className="font-medium">Used {count} sources</p>
        <ChevronDownIcon className="h-4 w-4" />
      </>
    )}
  </CollapsibleTrigger>
);

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-3 flex w-fit flex-col gap-2",
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className,
    )}
    {...props}
  />
);

export type SourceProps = ComponentProps<"a"> & {
  domain?: string;
  showAvatar?: boolean;
};

function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export const Source = ({
  href,
  title,
  domain,
  showAvatar = true,
  children,
  ...props
}: SourceProps) => {
  const sourceDomain = domain || (href ? extractDomainFromUrl(href) : "");

  return (
    <a
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
      href={href}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children ?? (
        <>
          {showAvatar && sourceDomain ? (
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={`https://img.logo.dev/${sourceDomain}?token=pk_BQw8Qo2gQeGk5LGKGGMUxA&format=png&size=24&theme=light`}
                alt={`${sourceDomain} logo`}
                onError={(e) => {
                  // Fallback to favicon if Logo.dev fails
                  (e.target as HTMLImageElement).src =
                    `https://${sourceDomain}/favicon.ico`;
                }}
              />
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {sourceDomain.split(".")[0]?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <BookIcon className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <span className="block font-medium text-sm truncate">{title}</span>
            {sourceDomain && (
              <span className="block text-xs text-muted-foreground truncate">
                {sourceDomain}
              </span>
            )}
          </div>
        </>
      )}
    </a>
  );
};
