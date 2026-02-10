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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { ErrorBoundary } from "@/components/error-boundary";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { WidgetErrorFallback } from "./widget-error-fallback";
import {
  useAvailableWidgets,
  useIsCustomizing,
  usePrimaryWidgets,
  useWidgetActions,
} from "./widget-provider";

// Placeholder that reserves space during dynamic import to prevent layout shift
// This is minimal - just the container shell. The widget's own WidgetSkeleton
// handles the full loading state with title/icon once the chunk loads.
function WidgetPlaceholder() {
  return (
    <div className="dark:bg-[#0c0c0c] bg-background border dark:border-[#1d1d1d] border-[#e6e6e6] h-[210px]" />
  );
}

// Dynamic imports for widget components to reduce initial bundle size
// Widgets are loaded on-demand when they appear in the user's dashboard
const AccountBalancesWidget = dynamic(
  () =>
    import("./account-balances").then((mod) => ({
      default: mod.AccountBalancesWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const BillableHoursWidget = dynamic(
  () =>
    import("./billable-hours").then((mod) => ({
      default: mod.BillableHoursWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const CashFlowWidget = dynamic(
  () => import("./cash-flow").then((mod) => ({ default: mod.CashFlowWidget })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const CategoryExpensesWidget = dynamic(
  () =>
    import("./category-expenses").then((mod) => ({
      default: mod.CategoryExpensesWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const CustomerLifetimeValueWidget = dynamic(
  () =>
    import("./customer-lifetime-value").then((mod) => ({
      default: mod.CustomerLifetimeValueWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const GrowthRateWidget = dynamic(
  () =>
    import("./growth-rate").then((mod) => ({ default: mod.GrowthRateWidget })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const InboxWidget = dynamic(
  () => import("./inbox").then((mod) => ({ default: mod.InboxWidget })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const InsightsWidget = dynamic(
  () => import("./insights").then((mod) => ({ default: mod.InsightsWidget })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const InvoicePaymentScoreWidget = dynamic(
  () =>
    import("./invoice-payment-score").then((mod) => ({
      default: mod.InvoicePaymentScoreWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const MonthlySpendingWidget = dynamic(
  () =>
    import("./monthly-spending").then((mod) => ({
      default: mod.MonthlySpendingWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const NetPositionWidget = dynamic(
  () =>
    import("./net-position").then((mod) => ({
      default: mod.NetPositionWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const OutstandingInvoicesWidget = dynamic(
  () =>
    import("./outstanding-invoices").then((mod) => ({
      default: mod.OutstandingInvoicesWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const OverdueInvoicesAlertWidget = dynamic(
  () =>
    import("./overdue-invoices-alert").then((mod) => ({
      default: mod.OverdueInvoicesAlertWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const ProfitAnalysisWidget = dynamic(
  () =>
    import("./profit-analysis").then((mod) => ({
      default: mod.ProfitAnalysisWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const ProfitMarginWidget = dynamic(
  () =>
    import("./profit-margin").then((mod) => ({
      default: mod.ProfitMarginWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const RecurringExpensesWidget = dynamic(
  () =>
    import("./recurring-expenses").then((mod) => ({
      default: mod.RecurringExpensesWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const RevenueForecastWidget = dynamic(
  () =>
    import("./revenue-forecast").then((mod) => ({
      default: mod.RevenueForecastWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const RevenueSummaryWidget = dynamic(
  () =>
    import("./revenue-summary").then((mod) => ({
      default: mod.RevenueSummaryWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const RunwayWidget = dynamic(
  () => import("./runway").then((mod) => ({ default: mod.RunwayWidget })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const TaxSummaryWidget = dynamic(
  () =>
    import("./tax-summary").then((mod) => ({ default: mod.TaxSummaryWidget })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const TimeTrackerWidget = dynamic(
  () =>
    import("./time-tracker").then((mod) => ({
      default: mod.TimeTrackerWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const TopCustomerWidget = dynamic(
  () =>
    import("./top-customer").then((mod) => ({
      default: mod.TopCustomerWidget,
    })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);
const VaultWidget = dynamic(
  () => import("./vault").then((mod) => ({ default: mod.VaultWidget })),
  { loading: () => <WidgetPlaceholder />, ssr: false },
);

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WidgetPreferences = RouterOutputs["widgets"]["getWidgetPreferences"];
type WidgetType = WidgetPreferences["primaryWidgets"][number];

const NUMBER_OF_WIDGETS = 7;

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
  "revenue-forecast": RevenueForecastWidget,
  "growth-rate": GrowthRateWidget,
  "profit-margin": ProfitMarginWidget,
  "profit-analysis": ProfitAnalysisWidget,
  "cash-flow": CashFlowWidget,
  "outstanding-invoices": OutstandingInvoicesWidget,
  inbox: InboxWidget,
  "time-tracker": TimeTrackerWidget,
  vault: VaultWidget,
  "account-balances": AccountBalancesWidget,
  "net-position": NetPositionWidget,
  "monthly-spending": MonthlySpendingWidget,
  "invoice-payment-score": InvoicePaymentScoreWidget,
  "recurring-expenses": RecurringExpensesWidget,
  "tax-summary": TaxSummaryWidget,
  "category-expenses": CategoryExpensesWidget,
  "overdue-invoices-alert": OverdueInvoicesAlertWidget,
  "billable-hours": BillableHoursWidget,
  "customer-lifetime-value": CustomerLifetimeValueWidget,
};

export function WidgetsGrid() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const gridRef = useRef<HTMLDivElement>(null!);

  const isCustomizing = useIsCustomizing();
  const primaryWidgets = usePrimaryWidgets();
  const availableWidgets = useAvailableWidgets();
  const { setIsCustomizing } = useWidgetActions();

  // Realtime subscription for insights
  // Note: Dynamic channel name required due to Supabase Realtime auth race condition
  // The effect cleanup handles channel removal, so this is safe
  useRealtime({
    channelName: `insights_${Date.now()}`,
    table: "insights",
    filter: user?.teamId ? `team_id=eq.${user.teamId}` : undefined,
    onEvent: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.insights.list.queryKey(),
      });
    },
  });

  useOnClickOutside(gridRef, (event) => {
    if (isCustomizing) {
      const target = event.target as Element;
      if (!target.closest("[data-no-close]")) {
        setIsCustomizing(false);
      }
    }
  });
  const {
    reorderPrimaryWidgets,
    moveToAvailable,
    moveToPrimary,
    swapWithLastPrimary,
    setSaving,
  } = useWidgetActions();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

      if (primaryWidgets.length >= NUMBER_OF_WIDGETS) {
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
    const wiggleIndex = (index % NUMBER_OF_WIDGETS) + 1;
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
      <div ref={gridRef}>
        {/* Primary Widgets */}
        {isCustomizing ? (
          <SortableContext
            items={primaryWidgets}
            strategy={rectSortingStrategy}
          >
            {/* Mobile: Horizontal scrollable row with snap */}
            <div className="lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4">
              <div className="flex gap-4">
                {/* Insights Widget - Fixed, first position */}
                <div className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center first:ml-4">
                  <ErrorBoundary fallback={<WidgetErrorFallback />}>
                    <InsightsWidget />
                  </ErrorBoundary>
                </div>
                {primaryWidgets.map((widgetType, index) => {
                  const WidgetComponent = WIDGET_COMPONENTS[widgetType];
                  const wiggleClass = getWiggleClass(index);

                  return (
                    <div
                      key={widgetType}
                      className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center last:mr-4"
                    >
                      <SortableCard
                        id={widgetType}
                        className="relative cursor-grab active:cursor-grabbing"
                        customizeMode={isCustomizing}
                        wiggleClass={wiggleClass}
                      >
                        <ErrorBoundary fallback={<WidgetErrorFallback />}>
                          <WidgetComponent />
                        </ErrorBoundary>
                      </SortableCard>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
              {/* Insights Widget - Fixed, first position */}
              <ErrorBoundary fallback={<WidgetErrorFallback />}>
                <InsightsWidget />
              </ErrorBoundary>
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
                    <ErrorBoundary fallback={<WidgetErrorFallback />}>
                      <WidgetComponent />
                    </ErrorBoundary>
                  </SortableCard>
                );
              })}
            </div>
          </SortableContext>
        ) : (
          <>
            {/* Mobile: Horizontal scrollable row with snap */}
            <div className="lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4">
              <div className="flex gap-4">
                {/* Insights Widget - Fixed, first position */}
                <div className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center first:ml-4">
                  <ErrorBoundary fallback={<WidgetErrorFallback />}>
                    <InsightsWidget />
                  </ErrorBoundary>
                </div>
                {primaryWidgets.map((widgetType) => {
                  const WidgetComponent = WIDGET_COMPONENTS[widgetType];
                  return (
                    <div
                      key={widgetType}
                      className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center last:mr-4"
                    >
                      <ErrorBoundary fallback={<WidgetErrorFallback />}>
                        <WidgetComponent />
                      </ErrorBoundary>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
              {/* Insights Widget - Fixed, first position */}
              <ErrorBoundary fallback={<WidgetErrorFallback />}>
                <InsightsWidget />
              </ErrorBoundary>
              {primaryWidgets.map((widgetType) => {
                const WidgetComponent = WIDGET_COMPONENTS[widgetType];
                return (
                  <ErrorBoundary
                    key={widgetType}
                    fallback={<WidgetErrorFallback />}
                  >
                    <WidgetComponent />
                  </ErrorBoundary>
                );
              })}
            </div>
          </>
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
              {/* Mobile: Horizontal scrollable row with snap */}
              <div className="lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4">
                <div className="flex gap-4">
                  {availableWidgets.map((widgetType, index) => {
                    const WidgetComponent = WIDGET_COMPONENTS[widgetType];
                    const wiggleClass = getWiggleClass(
                      primaryWidgets.length + index,
                    );

                    return (
                      <div
                        key={widgetType}
                        className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center first:ml-4 last:mr-4"
                      >
                        <SortableCard
                          id={widgetType}
                          className="opacity-60 hover:opacity-70 cursor-grab active:cursor-grabbing"
                          customizeMode={isCustomizing}
                          wiggleClass={wiggleClass}
                        >
                          <ErrorBoundary fallback={<WidgetErrorFallback />}>
                            <WidgetComponent />
                          </ErrorBoundary>
                        </SortableCard>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
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
                      <ErrorBoundary fallback={<WidgetErrorFallback />}>
                        <WidgetComponent />
                      </ErrorBoundary>
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
            <div className="shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] bg-background cursor-grabbing opacity-90 transform-gpu will-change-transform">
              <ErrorBoundary fallback={<WidgetErrorFallback />}>
                <WidgetComponent />
              </ErrorBoundary>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
