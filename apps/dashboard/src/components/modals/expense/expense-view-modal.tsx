"use client";

import ExpenseTabs from "@/components/cash-flow/expense-tabs";
import { ExpenseChart } from "@/components/charts/expense-chart";
import { FeatureInDevelopment } from "@/components/feature-in-development";
import { getDefaultDateRange } from "@/config/chart-date-range-default-picker";
import { useExpenseViewStore } from "@/store/expense-view";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useHotkeys } from "react-hotkeys-hook";

const defaultValue = getDefaultDateRange("monthly", "expense");

export function ExpenseViewModal() {
    const { isOpen, setOpen } = useExpenseViewStore();

    useHotkeys("meta+e", () => setOpen(true), {
        enableOnFormTags: true,
    });

    const value = {
        ...(defaultValue.from && { from: defaultValue.from }),
        ...(defaultValue.to && { to: defaultValue.to }),
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent
                className="overflow-hidden p-0 max-w-full w-full h-full md:min-h-[60%] md:max-h-[75%] md:min-w-[60%] md:max-w-[75%] m-0 rounded-2xl"
                hideClose
            >
                <FeatureInDevelopment featureName="Quick Access Expense View" isDisabled={true} />
            </DialogContent>
        </Dialog>
    );
}