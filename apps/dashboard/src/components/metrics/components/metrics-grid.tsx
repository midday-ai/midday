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
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useRef, useState } from "react";
import type { ChartId, ChartLayoutItem, ColSpan } from "../utils/chart-types";
import { LazyChart } from "./lazy-chart";

const COL_SPAN_CLASS: Record<ColSpan, string> = {
  4: "col-span-12 md:col-span-6 lg:col-span-4",
  6: "col-span-12 md:col-span-6",
  8: "col-span-12 md:col-span-8",
  12: "col-span-12",
};

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item!);
  return result;
}

function DroppableCell({
  id,
  colSpan,
  children,
}: {
  id: string;
  colSpan: ColSpan;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${COL_SPAN_CLASS[colSpan]} rounded transition-shadow duration-150 ${
        isOver ? "ring-2 ring-primary/40 ring-inset" : ""
      }`}
    >
      {children}
    </div>
  );
}

interface MetricsGridProps {
  layout: ChartLayoutItem[];
  onLayoutChange: (newLayout: ChartLayoutItem[]) => void;
  renderChart: (chartId: ChartId, index: number) => React.ReactNode;
  isEditing?: boolean;
}

export function MetricsGrid({
  layout,
  onLayoutChange,
  renderChart,
  isEditing = false,
}: MetricsGridProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const gridRef = useRef<HTMLDivElement>(null!);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const activeSensors = useSensors(pointerSensor, keyboardSensor);
  const noSensors = useSensors();
  const sensors = isEditing ? activeSensors : noSensors;

  const chartIds = layout.map((item) => item.id);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeIndex = chartIds.indexOf(active.id as ChartId);
    const overIndex = chartIds.indexOf(over.id as ChartId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const newLayout = arrayMove(layout, activeIndex, overIndex);
      onLayoutChange(newLayout);
    }

    setActiveId(null);
  }

  const activeItem = activeId
    ? layout.find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid grid-cols-12 gap-6 pb-20"
        ref={gridRef}
        data-metrics-grid
      >
        {layout.map((item, index) => {
          const isDeferred = index >= 3;
          const content = renderChart(item.id, index);

          return (
            <DroppableCell key={item.id} id={item.id} colSpan={item.colSpan}>
              {isDeferred ? (
                <LazyChart index={index - 3}>{content}</LazyChart>
              ) : (
                content
              )}
            </DroppableCell>
          );
        })}

        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div
              className="pointer-events-none rounded shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              style={{
                width: gridRef.current
                  ? (gridRef.current.getBoundingClientRect().width *
                      activeItem.colSpan) /
                      12 -
                    (activeItem.colSpan < 12 ? 12 : 0)
                  : undefined,
              }}
            >
              {renderChart(activeItem.id, 0)}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
