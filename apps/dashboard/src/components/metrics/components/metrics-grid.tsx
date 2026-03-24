"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import type { ChartId } from "../utils/chart-types";

interface MetricsGridProps {
  orderedCharts: ChartId[];
  isCustomizing: boolean;
  onChartOrderChange: (newOrder: ChartId[]) => void;
  renderChart: (chartId: ChartId, index: number) => React.ReactNode;
  getWiggleClass: (index: number) => string;
}

export function MetricsGrid({
  orderedCharts,
  isCustomizing,
  onChartOrderChange,
  renderChart,
  getWiggleClass,
}: MetricsGridProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const gridRef = useRef<HTMLDivElement>(null!);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeIndex = orderedCharts.indexOf(active.id as ChartId);
    const overIndex = orderedCharts.indexOf(over.id as ChartId);

    if (activeIndex !== overIndex) {
      const newOrder = arrayMove(orderedCharts, activeIndex, overIndex);
      onChartOrderChange(newOrder);
    }

    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8 pb-20" ref={gridRef}>
        {(() => {
          const feedId: ChartId = "activity-feed";
          const charts = orderedCharts.filter((id) => id !== feedId);
          const hasFeed = orderedCharts.includes(feedId);
          const firstChart = charts[0];
          const rest = charts.slice(1);

          const rows: React.ReactNode[] = [];

          if (firstChart) {
            rows.push(
              <div
                key="row-first"
                className={
                  hasFeed
                    ? "grid grid-cols-1 lg:grid-cols-3 gap-6"
                    : "grid grid-cols-1 lg:grid-cols-2 gap-6"
                }
              >
                <div className={hasFeed ? "lg:col-span-2" : undefined}>
                  {renderChart(firstChart, 0)}
                </div>
                {hasFeed ? renderChart(feedId, 1) : rest[0] ? renderChart(rest[0], 1) : <div />}
              </div>,
            );

            if (!hasFeed && rest[0]) {
              rest.shift();
            }
          }

          for (let i = 0; i < rest.length; i += 2) {
            const left = rest[i]!;
            const right = rest[i + 1];
            const idx = hasFeed ? i + 2 : i + 2;
            rows.push(
              <div
                key={`row-${left}`}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {renderChart(left, idx)}
                {right ? renderChart(right, idx + 1) : <div />}
              </div>,
            );
          }

          if (isCustomizing) {
            return <SortableContext items={orderedCharts}>{rows}</SortableContext>;
          }

          return rows;
        })()}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] bg-background cursor-grabbing opacity-90 transform-gpu will-change-transform border border-border p-6 rounded">
              {renderChart(activeId as ChartId, 0)}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
