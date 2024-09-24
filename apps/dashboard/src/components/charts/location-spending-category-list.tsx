"use client";

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Progress } from "@midday/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Category } from "../category";
import { SpendingCategoryItem } from "./spending-category-item";

type LocationData = {
    location_city: string;
    location_region: string;
    location_country: string;
    total_expense: number;
    transaction_count: number;
};

type Props = {
    data: LocationData[] | null;
    period: any;
    disabled: boolean;
    currency?: string;
};

export function LocationSpendingCategoryList({ data, period, disabled, currency = "USD" }: Props) {
    const [progressType, setProgressType] = useState<"expense" | "count">("expense");
    const [filterType, setFilterType] = useState<"city" | "region" | "country">("city");

    const filteredData = useMemo(() => {
        if (!data) return [];

        const groupedData = data.reduce((acc, curr) => {
            const key = curr[`location_${filterType}`];
            if (!acc[key]) {
                acc[key] = { ...curr };
            } else {
                acc[key].total_expense += curr.total_expense;
                acc[key].transaction_count += curr.transaction_count;
            }
            return acc;
        }, {} as Record<string, LocationData>);

        return Object.values(groupedData);
    }, [data, filterType]);

    const totalExpense = filteredData.reduce((acc, curr) => acc + curr.total_expense, 0);
    const totalCount = filteredData.reduce((acc, curr) => acc + curr.transaction_count, 0);

    if (!filteredData.length) {
        return (
            <div className="flex items-center justify-center aspect-square">
                <p className="text-sm text-[#606060]">
                    No transactions have been categorized in this period.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-end mb-4 py-2 gap-2">
                <Select
                    onValueChange={(value) => setFilterType(value as "city" | "region" | "country")}
                    defaultValue="city"
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select filter type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="city">Filter by City</SelectItem>
                        <SelectItem value="region">Filter by Region</SelectItem>
                        <SelectItem value="country">Filter by Country</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(value) => setProgressType(value as "expense" | "count")}
                    defaultValue="expense"
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select progress type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="expense">Ratio by Expense</SelectItem>
                        <SelectItem value="count">Ratio by Count</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ul className="mt-4 space-y-4 overflow-auto scrollbar-hide aspect-square pb-14">
                {filteredData.map((location) => {
                    const locationName = location[`location_${filterType}`];
                    const progressValue = progressType === "expense"
                        ? (location.total_expense / totalExpense) * 100
                        : (location.transaction_count / totalCount) * 100;

                    return (
                        <li key={locationName}>
                            <HoverCard openDelay={10} closeDelay={10}>
                                <HoverCardTrigger asChild>
                                    <Link
                                        className="flex items-center"
                                        href={`/transactions?location=${locationName}&start=${period?.from}&end=${period?.to}`}
                                    >
                                        <Category
                                            name={locationName}
                                            color={"#000000"}
                                            className="text-sm text-primary space-x-3 w-[90%]"
                                        />
                                        <Progress
                                            className="w-full rounded-none h-[6px]"
                                            value={progressValue}
                                        />
                                    </Link>
                                </HoverCardTrigger>

                                {!disabled && (
                                    <HoverCardContent className="border shadow-sm bg-background py-1 px-0">
                                        <SpendingCategoryItem
                                            color={"#000000"}
                                            name={locationName}
                                            amount={location.total_expense}
                                            currency={currency}
                                            percentage={progressType === "expense"
                                                ? location.total_expense / totalExpense
                                                : location.transaction_count / totalCount
                                            }
                                        />
                                    </HoverCardContent>
                                )}
                            </HoverCard>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}