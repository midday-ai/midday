"use client";

import { cn } from "@midday/ui/cn";
import type { Header } from "@tanstack/react-table";

interface ResizeHandleProps<TData> {
  header: Header<TData, unknown>;
  className?: string;
}

export function ResizeHandle<TData>({
  header,
  className,
}: ResizeHandleProps<TData>) {
  if (!header.column.getCanResize()) {
    return null;
  }

  return (
    <div
      onDoubleClick={() => header.column.resetSize()}
      onMouseDown={(e) => {
        e.stopPropagation(); // Prevent drag from triggering
        header.getResizeHandler()(e);
      }}
      onTouchStart={(e) => {
        e.stopPropagation(); // Prevent drag from triggering
        header.getResizeHandler()(e);
      }}
      onPointerDown={(e) => e.stopPropagation()} // Stop dnd-kit from capturing
      className={cn(
        "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
        "bg-transparent",
        className,
      )}
      style={{
        transform: "translateX(50%)",
      }}
    />
  );
}
