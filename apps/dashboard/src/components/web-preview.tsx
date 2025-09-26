"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Input } from "@midday/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import type { ComponentProps, ReactNode } from "react";

export type WebPreviewProps = ComponentProps<"div">;

export const WebPreview = ({
  className,
  children,
  ...props
}: WebPreviewProps) => {
  return (
    <div
      className={cn(
        "flex size-full flex-col rounded-lg border bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export type WebPreviewNavigationProps = ComponentProps<"div">;

export const WebPreviewNavigation = ({
  className,
  children,
  ...props
}: WebPreviewNavigationProps) => (
  <div
    className={cn("flex items-center gap-1 border-b p-2", className)}
    {...props}
  >
    {children}
  </div>
);

export type WebPreviewNavigationButtonProps = ComponentProps<typeof Button> & {
  tooltip?: string;
};

export const WebPreviewNavigationButton = ({
  onClick,
  disabled,
  tooltip,
  children,
  ...props
}: WebPreviewNavigationButtonProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="h-8 w-8 p-0 hover:text-foreground"
          disabled={disabled}
          onClick={onClick}
          size="sm"
          variant="ghost"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export type WebPreviewUrlProps = ComponentProps<typeof Input> & {
  url?: string;
  onUrlChange?: (url: string) => void;
};

export const WebPreviewUrl = ({
  value,
  onChange,
  onKeyDown,
  url,
  onUrlChange,
  ...props
}: WebPreviewUrlProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const target = event.target as HTMLInputElement;
      onUrlChange?.(target.value);
    }
    onKeyDown?.(event);
  };

  return (
    <Input
      className="h-8 flex-1 text-sm"
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder="Enter URL..."
      value={value ?? url}
      {...props}
    />
  );
};

export type WebPreviewBodyProps = ComponentProps<"iframe"> & {
  loading?: ReactNode;
  url?: string;
};

export const WebPreviewBody = ({
  className,
  loading,
  src,
  url,
  ...props
}: WebPreviewBodyProps) => {
  return (
    <div className="flex-1">
      <iframe
        className={cn("size-full", className)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        src={(src ?? url) || undefined}
        title="Preview"
        {...props}
      />
      {loading}
    </div>
  );
};
