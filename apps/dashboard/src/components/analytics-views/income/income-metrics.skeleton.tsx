import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import {
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
  User,
} from "lucide-react";
import React from "react";

/**
 * IncomeMetricsSkeleton Component
 *
 * This component renders a skeleton layout for the Income Metrics view.
 * It displays placeholder elements for various sections of the income dashboard,
 * including the header, balance card, account summaries, recent activity, and a card display.
 *
 * The skeleton is used to improve perceived performance by showing a loading state
 * while the actual data is being fetched or processed.
 *
 * @component
 * @example
 * ```tsx
 * <IncomeMetricsSkeleton />
 * ```
 */
export const IncomeMetricsSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header section */}
        <div className="mb-8 flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Balance card section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            {/* Cash flow chart placeholder */}
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>

        {/* Account summaries section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {["Business account", "Total Saving", "Tax Reserve"].map((title) => (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent activity and card section */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My Card</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
