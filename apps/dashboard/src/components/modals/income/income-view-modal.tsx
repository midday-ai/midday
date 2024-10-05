"use client";

import { IncomeChartCard } from "@/components/charts/card/income-chart-card";
import { IncomeGrowthRateBarChart } from "@/components/charts/income-growth-rate-bar-chart";
import { getDefaultDateRange } from "@/config/chart-date-range-default-picker";
import { useIncomeViewStore } from "@/store/income-view";
import { createClient } from "@midday/supabase/client";
import { getMetricsQuery, getUserQuery } from "@midday/supabase/queries";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { Skeleton } from "@midday/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const defaultValue = getDefaultDateRange("monthly", "income");

type IncomeData = {
  summary: {
    averageIncome: number;
    currency: string | undefined;
  };
  meta: {
    type: string;
    currency: string | undefined;
  };
  result:
    | {
        date: string;
        precentage: {
          value: string | number;
          status: string;
        };
        current: {
          date: string;
          value: number;
          currency: string | undefined;
        };
        previous: {
          date: string | undefined;
          value: number | undefined;
          currency: string | undefined;
        };
      }[]
    | undefined;
};

type IncomeGrowthRateData = {
  result: Array<{
    date: string;
    income: number;
  }>;
  meta: {
    currency: string;
  };
};

const IncomeSkeleton = () => (
  <div className="flex flex-col gap-4 md:p-[2.5%] w-full">
    {/* IncomeChartCard skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>

    {/* IncomeGrowthRateBarChart skeleton */}
    <div className="md:mt-12 space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-[250px] w-full" />
    </div>
  </div>
);

/**
 * IncomeViewModal Component
 *
 * @component
 * @description
 * This component renders a modal dialog that displays detailed income information.
 * It fetches and presents income data, including charts and growth rate information.
 *
 * @example
 * ```tsx
 * <IncomeViewModal />
 * ```
 */

export const IncomeViewModal = React.memo(function IncomeViewModal() {
  const supabase = useMemo(() => createClient(), []);
  const { isOpen, setOpen } = useIncomeViewStore();
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useHotkeys("meta+i", () => setOpen(true), {
    enableOnFormTags: true,
  });

  const value = useMemo(
    () => ({
      ...(defaultValue.from && { from: defaultValue.from }),
      ...(defaultValue.to && { to: defaultValue.to }),
    }),
    [],
  );

  const fetchIncomeData = useCallback(async () => {
    if (isLoading || incomeData) return;

    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { data: userData } = await getUserQuery(
        supabase,
        session?.user?.id ?? "",
      );

      const data = await getMetricsQuery(supabase, {
        ...defaultValue,
        ...value,
        currency: "USD",
        teamId: userData?.team_id ?? "",
        type: "profit",
      });

      const incomeData: IncomeData = {
        summary: {
          averageIncome: data.summary.currentTotal || 0,
          currency: data.summary.currency,
        },
        meta: data.meta,
        result: data.result,
      };

      setIncomeData(incomeData);
    } catch (error) {
      console.error("Error fetching income data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, value, isLoading, incomeData]);

  useEffect(() => {
    if (isOpen) {
      fetchIncomeData();
    }
  }, [isOpen, fetchIncomeData]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (!open) {
        // Reset data when closing the modal
        setIncomeData(null);
        setIsLoading(false);
      }
    },
    [setOpen],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 max-w-full w-full h-full md:min-h-[70%] md:max-h-[75%] md:min-w-[70%] md:max-w-[75%] m-0 rounded-2xl"
        hideClose
      >
        <ModalContent data={incomeData} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
});

/**
 * ModalContent Component
 *
 * @component
 * @description Renders the content of the modal based on loading state and data availability.
 * @param {Object} props
 * @param {IncomeData | null} props.data - The income data to display
 * @param {boolean} props.isLoading - Indicates if data is currently being loaded
 */
const ModalContent = React.memo<{
  data: IncomeData | null;
  isLoading: boolean;
}>(({ data, isLoading }) => {
  if (isLoading) {
    return <IncomeSkeleton />;
  }

  if (!data) {
    return null;
  }

  return <IncomeDetails data={data} />;
});

/**
 * IncomeDetails Component
 *
 * @component
 * @description Renders detailed income information including charts and tabs.
 * @param {Object} props
 * @param {IncomeData} props.data - The income data to display
 */
const IncomeDetails = React.memo<{ data: IncomeData }>(({ data }) => {
  return (
    <div className="flex flex-col gap-4 md:p-[5%] overflow-y-auto scrollbar-hide">
      <p className="text-2xl font-bold mb-4">Income Overview</p>

      <Tabs defaultValue="overview" className="w-full flex flex-col gap-4">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <p className="text-sm text-gray-600 mb-4 md:max-w-[60%]">
            This income overview provides a detailed breakdown of your financial
            inflows. It includes a chart showing your monthly income,
            highlighting both recurring and one-time revenues.
          </p>
          <div>
            <IncomeChartCard
              data={data}
              currency={data.meta.currency}
              disabled={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="details">
          <p className="text-sm text-gray-600 mb-4 md:max-w-[60%]">
            Below, you'll find a growth rate chart that illustrates how your
            income has changed over time, helping you identify trends and make
            informed financial decisions.
          </p>
          <div>
            <IncomeGrowthRateBarChart
              data={{
                result:
                  data?.result?.map(
                    (
                      item,
                    ): {
                      date: string;
                      income: number;
                      growthRate: number;
                    } => ({
                      date: item.date,
                      income: Number(item.current?.value) ?? 0,
                      growthRate: Number(item.precentage?.value) ?? 0,
                    }),
                  ) ?? [],
                meta: {
                  currency: data.meta.currency ?? "USD",
                },
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

IncomeDetails.displayName = "IncomeDetails";
