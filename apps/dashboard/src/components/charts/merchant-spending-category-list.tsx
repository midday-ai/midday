"use client";

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Progress } from "@midday/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import Link from "next/link";
import { useState } from "react";
import { Category } from "../category";
import { SpendingCategoryItem } from "./spending-category-item";

type Props = {
    data: {
        merchant_name: string;
        total_expense: number;
        transaction_count: number;
    }[] | null;
    period: any;
    disabled: boolean;
    currency?: string;
};

export function MerchantSpendingCategoryList({ data, period, disabled, currency = "USD" }: Props) {
    const [progressType, setProgressType] = useState<"expense" | "count">("expense");

    if (!data?.length) {
        return (
            <div className="flex items-center justify-center aspect-square">
                <p className="text-sm text-[#606060]">
                    No transactions have been categorized in this period.
                </p>
            </div>
        );
    }

    const totalExpense = data.reduce((acc, curr) => acc + curr.total_expense, 0);
    const totalCount = data.reduce((acc, curr) => acc + curr.transaction_count, 0);

    return (
        <>
            <div className="flex justify-end mb-4 py-2">
                <Select
                    onValueChange={(value) => setProgressType(value as "expense" | "count")}
                    defaultValue="expense"
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select progress type" className="border-0"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="expense">Ratio by Expense</SelectItem>
                        <SelectItem value="count">Ratio by Count</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ul className="mt-4 space-y-4 overflow-auto scrollbar-hide aspect-square pb-14">
                {data.map(({ merchant_name, total_expense, transaction_count }) => {
                    const progressValue = progressType === "expense"
                        ? (total_expense / totalExpense) * 100
                        : (transaction_count / totalCount) * 100;

                    return (
                        <li key={merchant_name}>
                            <HoverCard openDelay={10} closeDelay={10}>
                                <HoverCardTrigger asChild>
                                    <Link
                                        className="flex items-center"
                                        href={`/transactions?merchant=${merchant_name}&start=${period?.from}&end=${period?.to}`}
                                    >
                                        <Category
                                            key={merchant_name}
                                            name={merchant_name}
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
                                            name={merchant_name}
                                            amount={total_expense}
                                            currency={currency}
                                            percentage={progressType === "expense"
                                                ? total_expense / totalExpense
                                                : transaction_count / totalCount
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
