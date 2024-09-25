"use client";

import { ExpenseChartCard } from "@/components/charts/card/expense-chart-card";
import { ExpenseGrowthRateBarChart } from "@/components/charts/expense-growth-rate-bar-chart";
import { getDefaultDateRange } from "@/config/chart-date-range-default-picker";
import { useExpenseViewStore } from "@/store/expense-view";
import { createClient } from "@midday/supabase/client";
import { getExpensesQuery, getUserQuery } from "@midday/supabase/queries";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { Skeleton } from "@midday/ui/skeleton"; // Add this import
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const defaultValue = getDefaultDateRange("monthly", "expense");

type ExpenseData = {
    summary: {
        averageExpense: number;
        currency: string | undefined;
    };
    meta: {
        type: string;
        currency: string | undefined;
    };
    result: {
        value: number;
        recurring: number;
        total: number;
        date: string;
        recurring_value: number;
        currency: string;
    }[];
}

type ExpenseGrowthRateData = {
    result: Array<{
        date: string;
        expense: number;
    }>;
    meta: {
        currency: string;
    };
}

const ExpenseSkeleton = () => (
    <div className="flex flex-col gap-4 md:p-[2.5%] w-full">
        {/* ExpenseChartCard skeleton */}
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-[300px] w-full" />
        </div>

        {/* ExpenseGrowthRateBarChart skeleton */}
        <div className="md:mt-12 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-[250px] w-full" />
        </div>
    </div>
);

export const ExpenseViewModal = React.memo(function ExpenseViewModal() {
    const supabase = useMemo(() => createClient(), []);
    const { isOpen, setOpen } = useExpenseViewStore();
    const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useHotkeys("meta+e", () => setOpen(true), {
        enableOnFormTags: true,
    });

    const value = useMemo(() => ({
        ...(defaultValue.from && { from: defaultValue.from }),
        ...(defaultValue.to && { to: defaultValue.to }),
    }), []);

    const fetchExpenseData = useCallback(async () => {
        if (isLoading || expenseData) return;
        
        setIsLoading(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            const { data: userData } = await getUserQuery(
                supabase,
                session?.user?.id ?? ''
            );

            const data: ExpenseData = await getExpensesQuery(supabase, {
                ...defaultValue,
                ...value,
                currency: "USD",
                teamId: userData?.team_id ?? "",
            });

            setExpenseData(data);
        } catch (error) {
            console.error("Error fetching expense data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, value, isLoading, expenseData]);

    useEffect(() => {
        if (isOpen) {
            fetchExpenseData();
        }
    }, [isOpen, fetchExpenseData]);

    const handleOpenChange = useCallback((open: boolean) => {
        setOpen(open);
        if (!open) {
            // Reset data when closing the modal
            setExpenseData(null);
            setIsLoading(false);
        }
    }, [setOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="overflow-hidden p-0 max-w-full w-full h-full md:min-h-[60%] md:max-h-[75%] md:min-w-[60%] md:max-w-[75%] m-0 rounded-2xl"
                hideClose
            >
                <ModalContent data={expenseData} isLoading={isLoading} />
            </DialogContent>
        </Dialog>
    );
});


const ModalContent = React.memo<{ data: ExpenseData | null, isLoading: boolean }>(({ data, isLoading }) => {
    if (isLoading) {
        return <ExpenseSkeleton />;
    }

    if (!data) {
        return null;
    }

    return <ExpenseDetails data={data} />;
});


const ExpenseDetails = React.memo<{ data: ExpenseData }>(({ data }) => {
    const growthRateData: ExpenseGrowthRateData = useMemo(() => ({
        result: data.result.map((item) => ({
            date: item.date,
            expense: item.recurring_value,
        })),
        meta: {
            currency: data.meta.currency ?? "USD",
        },
    }), [data]);

    return (
        <div className="flex flex-col gap-4 md:p-[2.5%]">
            
            <ExpenseChartCard
                data={data}
                value={defaultValue}
                defaultValue={defaultValue}
                currency={data.meta.currency}
                disabled={false}
            />

            <div className="md:mt-12">
                <ExpenseGrowthRateBarChart
                    data={growthRateData}
                />
            </div>

        </div>
    );
});

ExpenseDetails.displayName = 'ExpenseDetails';