import { MonthlyExpenseChart } from "@/components/charts/monthly-expense-chart";
import { Button } from "@midday/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@midday/ui/dialog";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useState } from "react";

type Props = {
    value: {
        from?: string;
        to?: string;
        period?: string;
    };
    defaultValue: {
        from: string;
        to: string;
        period: string;
    };
    disabled?: boolean;
    currency?: string;
};


export function DrilldownMonthlyExpenseChartModal({
    value,
    defaultValue,
    disabled,
    currency = "USD",
}: Props) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    Expense Drilldown
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
            </DialogTrigger>
            <DialogContent className="min-w-[85%] min-h-[85%] max-w-[95%] max-h-[95%] md:p-[5%] overflow-y-auto scrollbar-hide">
                <MonthlyExpenseChart
                    value={value}
                    defaultValue={defaultValue}
                    currency={currency}
                />
            </DialogContent>
        </Dialog>
    );
}