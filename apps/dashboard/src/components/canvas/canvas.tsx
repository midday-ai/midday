"use client";

import { renderCanvas } from "@/components/canvas/canvas-registry";
import type { MessageDataParts } from "@api/ai/tools/registry";
import { cn } from "@midday/ui/cn";
import { useMemo } from "react";

interface CanvasProps {
  data: MessageDataParts["data-canvas"][];
  title?: string;
  className?: string;
  onClose?: () => void;
}

export function Canvas({ data, title, className, onClose }: CanvasProps) {
  const latestData = useMemo(() => {
    return data[data.length - 1];
  }, [data]);

  // Safety check for canvas data
  if (!latestData || !latestData.type) {
    return (
      <div
        className={cn("w-full bg-background h-full flex flex-col", className)}
      >
        <div className="p-6">
          <div className="text-center text-muted-foreground">
            No canvas data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full bg-background h-full flex flex-col", className)}>
      {renderCanvas(latestData.type, latestData)}
    </div>
  );
}
