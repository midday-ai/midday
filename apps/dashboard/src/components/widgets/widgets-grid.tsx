"use client";

import { useTRPC } from "@/trpc/client";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import { CashFlowWidget } from "./cash-flow";
import { GrowthRateWidget } from "./growth-rate";
import { InboxWidget } from "./inbox";
import { OutstandingInvoicesWidget } from "./outstanding-invoices";
import { ProfitMarginWidget } from "./profit-margin";
import { RevenueSummaryWidget } from "./revenue-summary";
import { RunwayWidget } from "./runway";
import { TopCustomerWidget } from "./top-customer";
import {
  useAvailableWidgets,
  useIsCustomizing,
  usePrimaryWidgets,
  useWidgetActions,
} from "./widget-provider";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WidgetPreferences = RouterOutputs["widgets"]["getWidgetPreferences"];
type WidgetType = WidgetPreferences["primaryWidgets"][number];

// Sortable Card Component
function SortableCard({
  id,
  children,
  className,
  customizeMode,
  wiggleClass,
}: {
  id: string;
  children: React.ReactNode;
  className: string;
  customizeMode: boolean;
  wiggleClass?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !customizeMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${wiggleClass || ""} ${
        isDragging
          ? "opacity-100 z-50 shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] scale-105"
          : ""
      } relative`}
      {...attributes}
      {...(customizeMode ? listeners : {})}
    >
      {children}
    </div>
  );
}

// Widget mapping to components
const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  runway: RunwayWidget,
  "top-customer": TopCustomerWidget,
  "revenue-summary": RevenueSummaryWidget,
  "growth-rate": GrowthRateWidget,
  "profit-margin": ProfitMarginWidget,
  "cash-flow": CashFlowWidget,
  "outstanding-invoices": OutstandingInvoicesWidget,
  inbox: InboxWidget,
};

export function WidgetsGrid() {
  const trpc = useTRPC();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const isCustomizing = useIsCustomizing();
  const primaryWidgets = usePrimaryWidgets();
  const availableWidgets = useAvailableWidgets();
  const {
    reorderPrimaryWidgets,
    moveToAvailable,
    moveToPrimary,
    swapWithLastPrimary,
    setSaving,
  } = useWidgetActions();

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Auto-save when primary widgets change
  const updatePreferencesMutation = useMutation(
    trpc.widgets.updateWidgetPreferences.mutationOptions({
      onMutate: () => {
        setSaving(true);
      },
      onSettled: () => {
        setSaving(false);
      },
    }),
  );

  // DnD Kit handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as WidgetType;
    const overId = over.id as WidgetType;

    // Find which section the active widget is in
    const activeInPrimary = primaryWidgets.includes(activeId);
    const activeInAvailable = availableWidgets.includes(activeId);
    const overInPrimary = primaryWidgets.includes(overId);
    const overInAvailable = availableWidgets.includes(overId);

    // Reordering within primary
    if (activeInPrimary && overInPrimary) {
      const activeIndex = primaryWidgets.indexOf(activeId);
      const overIndex = primaryWidgets.indexOf(overId);

      if (activeIndex !== overIndex) {
        const newOrder = arrayMove(primaryWidgets, activeIndex, overIndex);
        reorderPrimaryWidgets(newOrder);
        setTimeout(() => {
          updatePreferencesMutation.mutate({ primaryWidgets: newOrder });
        }, 100);
      }
    }
    // Moving from available to primary
    else if (activeInAvailable && overInPrimary) {
      const overIndex = primaryWidgets.indexOf(overId);
      const insertIndex = overIndex >= 0 ? overIndex : primaryWidgets.length;

      if (primaryWidgets.length >= 7) {
        // Swap with last primary widget
        swapWithLastPrimary(activeId, insertIndex);
        const newPrimary = [...primaryWidgets.slice(0, -1)];
        newPrimary.splice(insertIndex, 0, activeId);

        setTimeout(() => {
          updatePreferencesMutation.mutate({ primaryWidgets: newPrimary });
        }, 100);
      } else {
        // Insert at the specific position where dropped
        const newPrimary = [...primaryWidgets];
        newPrimary.splice(insertIndex, 0, activeId);

        moveToPrimary(activeId, newPrimary);

        setTimeout(() => {
          updatePreferencesMutation.mutate({ primaryWidgets: newPrimary });
        }, 100);
      }
    }
    // Moving from primary to available
    else if (activeInPrimary && overInAvailable) {
      moveToAvailable(activeId);
      const newPrimary = primaryWidgets.filter((w) => w !== activeId);
      setTimeout(() => {
        updatePreferencesMutation.mutate({ primaryWidgets: newPrimary });
      }, 100);
    }

    setActiveId(null);
  }

  // Get wiggle class for customize mode
  const getWiggleClass = (index: number) => {
    if (!isCustomizing) return "";
    const WIGGLE_VARIANTS = 7;
    const wiggleIndex = (index % WIGGLE_VARIANTS) + 1;
    return `wiggle-${wiggleIndex}`;
  };

  const WidgetComponent = WIDGET_COMPONENTS[activeId as WidgetType];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        {/* Primary Widgets */}
        {isCustomizing ? (
          <SortableContext
            items={primaryWidgets}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
              {primaryWidgets.map((widgetType, index) => {
                const WidgetComponent = WIDGET_COMPONENTS[widgetType];
                const wiggleClass = getWiggleClass(index);

                return (
                  <SortableCard
                    key={widgetType}
                    id={widgetType}
                    className="relative cursor-grab active:cursor-grabbing"
                    customizeMode={isCustomizing}
                    wiggleClass={wiggleClass}
                  >
                    <WidgetComponent />
                  </SortableCard>
                );
              })}
            </div>
          </SortableContext>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
            {primaryWidgets.map((widgetType) => {
              const WidgetComponent = WIDGET_COMPONENTS[widgetType];
              return <WidgetComponent key={widgetType} />;
            })}
          </div>
        )}

        {/* Separator and Available Widgets (shown when customizing) */}
        {isCustomizing && availableWidgets.length > 0 && (
          <>
            {/* Visual Separator */}
            <div className="my-8">
              <div className="border-t border-dashed border-border" />
            </div>

            {/* Available Widgets - Draggable */}
            <SortableContext
              items={availableWidgets}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
                {availableWidgets.map((widgetType, index) => {
                  const WidgetComponent = WIDGET_COMPONENTS[widgetType];
                  const wiggleClass = getWiggleClass(
                    primaryWidgets.length + index,
                  );

                  return (
                    <SortableCard
                      key={widgetType}
                      id={widgetType}
                      className="opacity-60 hover:opacity-70 cursor-grab active:cursor-grabbing"
                      customizeMode={isCustomizing}
                      wiggleClass={wiggleClass}
                    >
                      <WidgetComponent />
                    </SortableCard>
                  );
                })}
              </div>
            </SortableContext>
          </>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] bg-background cursor-grab active:cursor-grabbing opacity-90 transform-gpu will-change-transform">
              <WidgetComponent />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
