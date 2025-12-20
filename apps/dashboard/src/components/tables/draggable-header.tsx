"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@midday/ui/cn";
import { TableHead } from "@midday/ui/table";
import { GripVertical } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

interface DraggableHeaderProps {
  id: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export function DraggableHeader({
  id,
  children,
  className,
  style,
  disabled = false,
}: DraggableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const dragStyle: CSSProperties = {
    // Use Translate instead of Transform to avoid scaling content
    transform: CSS.Translate.toString(transform),
    transition,
    ...style,
  };

  return (
    <TableHead
      ref={setNodeRef}
      className={cn(
        "group/header relative h-full px-4 border-t border-border flex items-center select-none",
        "shadow-none outline-none ring-0 focus:shadow-none focus:outline-none focus:ring-0 hover:shadow-none",
        isDragging && "border border-border bg-background z-50",
        className,
      )}
      style={dragStyle}
    >
      <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
      {!disabled && (
        <GripVertical
          size={14}
          className="ml-1 text-muted-foreground opacity-0 group-hover/header:opacity-100 flex-shrink-0 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        />
      )}
    </TableHead>
  );
}
