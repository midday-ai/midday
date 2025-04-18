import type * as React from "react";
import { cn } from "../utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-r from-transparent via-primary/10 to-transparent dark:via-primary/10",
        "bg-[length:200%_100%]",
        "animate-shimmer rounded-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
