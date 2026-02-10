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
      <div className="space-y-8 pb-8" ref={gridRef}>
        {isCustomizing ? (
          <SortableContext items={orderedCharts}>
            {orderedCharts.map((chartId, index) => {
              if (index === 0) {
                // First chart: full-width
                return (
                  <div key={chartId} className="w-full">
                    {renderChart(chartId, index)}
                  </div>
                );
              }
              if ((index - 1) % 2 === 0) {
                // Start of a pair (index 1, 3, 5, etc.): create two-column row
                const nextChartId = orderedCharts[index + 1];
                return (
                  <div
                    key={`row-${chartId}`}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {renderChart(chartId, index)}
                    {nextChartId ? (
                      renderChart(nextChartId, index + 1)
                    ) : (
                      <div /> // Empty placeholder if odd number of charts
                    )}
                  </div>
                );
              }
              // Second chart in pair: already rendered above
              return null;
            })}
          </SortableContext>
        ) : (
          orderedCharts.map((chartId, index) => {
            if (index === 0) {
              // First chart: full-width
              return (
                <div key={chartId} className="w-full">
                  {renderChart(chartId, index)}
                </div>
              );
            }
            if ((index - 1) % 2 === 0) {
              // Start of a pair (index 1, 3, 5, etc.): create two-column row
              const nextChartId = orderedCharts[index + 1];
              return (
                <div
                  key={`row-${chartId}`}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {renderChart(chartId, index)}
                  {nextChartId ? (
                    renderChart(nextChartId, index + 1)
                  ) : (
                    <div /> // Empty placeholder if odd number of charts
                  )}
                </div>
              );
            }
            // Second chart in pair: already rendered above
            return null;
          })
        )}

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
