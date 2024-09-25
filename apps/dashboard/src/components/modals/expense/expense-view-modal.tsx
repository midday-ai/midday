"use client";

import { FeatureInDevelopment } from "@/components/feature-in-development";
import { useExpenseViewStore } from "@/store/expense-view";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useHotkeys } from "react-hotkeys-hook";

export function ExpenseViewModal() {
    const { isOpen, setOpen } = useExpenseViewStore();

    useHotkeys("meta+e", () => setOpen(true), {
        enableOnFormTags: true,
    });

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