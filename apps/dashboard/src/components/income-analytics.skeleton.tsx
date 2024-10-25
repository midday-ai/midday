import { Card } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";

/**
 * `IncomeAnalyticsSkeleton` is a React component that renders a skeleton loader for a grid of analytics cards.
 *
 * This component is used as a placeholder while the analytics data is being fetched or loaded, providing a visual representation
 * of analytics cards in a loading state. Each skeleton card includes placeholders for chart elements, titles, and descriptive data.
 *
 * The skeleton cards are displayed in a responsive grid layout that adjusts based on the screen size, showing:
 * - 1 column on small screens (default).
 * - 2 columns on medium screens (md).
 * - 3 columns on large screens (lg).
 * - 4 columns on extra-large screens (2xl).
 *
 * @returns {JSX.Element} The rendered skeleton loader component.
 *
 * @example
 * ```jsx
 * <IncomeAnalyticsSkeleton />
 * ```
 */
export function IncomeAnalyticsSkeleton(): JSX.Element {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mx-auto mt-8">
      {/* Render 8 skeleton cards for loading analytics */}
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index.toString()} className="w-full flex flex-col">
          <div className="p-6">
            {/* Skeleton for the chart or graph */}
            <Skeleton className="h-24 w-full rounded-md" />

            {/* Skeleton for the analytics title */}
            <div className="mt-6">
              <Skeleton className="h-5 w-[50%]" />
            </div>

            {/* Skeleton for the analytics descriptive data (multiple lines) */}
            <div className="space-y-2 py-4 pb-0">
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-[90%]" />
            </div>

            {/* Skeleton for the action buttons, e.g., filter or export options */}
            <div className="flex items-center justify-between space-x-2 mt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
