"use client";

import { useDraggable } from "@dnd-kit/core";
import { useCallback, useRef } from "react";
import type { ColSpan } from "../utils/chart-types";

const SNAP_THRESHOLDS: { max: number; colSpan: ColSpan }[] = [
  { max: 5 / 12, colSpan: 4 },
  { max: 7 / 12, colSpan: 6 },
  { max: 10 / 12, colSpan: 8 },
  { max: Number.POSITIVE_INFINITY, colSpan: 12 },
];

function snapToColSpan(fraction: number): ColSpan {
  for (const { max, colSpan } of SNAP_THRESHOLDS) {
    if (fraction < max) return colSpan;
  }
  return 12;
}

type ResizeSide = "left" | "right";

export function DraggableChartCard({
  id,
  children,
  isEditing = false,
  onResize,
}: {
  id: string;
  children: React.ReactNode;
  isEditing?: boolean;
  onResize: (colSpan: ColSpan) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: !isEditing,
  });

  const startResize = useCallback(
    (e: React.PointerEvent, side: ResizeSide) => {
      if (!isEditing) return;
      e.stopPropagation();
      e.preventDefault();

      const card = cardRef.current;
      if (!card) return;

      const gridEl = card.closest("[data-metrics-grid]") as HTMLElement;
      if (!gridEl) return;

      const gridWidth = gridEl.getBoundingClientRect().width;
      const initialWidth = card.getBoundingClientRect().width;
      const initialMouseX = e.clientX;
      let currentSnap: ColSpan | null = null;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - initialMouseX;
        const desiredWidth =
          side === "right" ? initialWidth + delta : initialWidth - delta;
        const fraction = Math.max(0.1, desiredWidth / gridWidth);
        const snapped = snapToColSpan(fraction);

        if (snapped !== currentSnap) {
          currentSnap = snapped;
          onResize(snapped);
        }
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [onResize, isEditing],
  );

  const composedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [setNodeRef],
  );

  return (
    <div
      id={id}
      ref={composedRef}
      className={`relative transition-opacity duration-150 scroll-mt-24 ${isDragging ? "opacity-30" : ""} ${isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}
      {...(isEditing ? { ...attributes, ...listeners } : {})}
    >
      {children}

      {isEditing && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-4 z-20 cursor-col-resize group/resize-l"
            onPointerDown={(e) => startResize(e, "left")}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-0.5 w-1 h-8 rounded-full bg-border opacity-60 group-hover/resize-l:opacity-100 transition-opacity" />
          </div>
          <div
            className="absolute inset-y-0 right-0 w-4 z-20 cursor-col-resize group/resize-r"
            onPointerDown={(e) => startResize(e, "right")}
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-0.5 w-1 h-8 rounded-full bg-border opacity-60 group-hover/resize-r:opacity-100 transition-opacity" />
          </div>
        </>
      )}
    </div>
  );
}
