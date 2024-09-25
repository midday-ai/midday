"use client";

import IncomeView from "@/components/views/income/income-view";
import { useIncomeViewStore } from "@/store/income-view";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useHotkeys } from "react-hotkeys-hook";

/**
 * IncomeViewModal Component
 * 
 * This component renders a modal dialog that displays the IncomeView component.
 * It utilizes the useIncomeViewStore for state management and implements a hotkey
 * for quick access.
 * 
 * @component
 * @example
 * ```tsx
 * <IncomeViewModal />
 * ```
 */
export function IncomeViewModal() {
    // Access the modal's open state and setter from the income view store
    const { isOpen, setOpen } = useIncomeViewStore();

    // Set up a hotkey (Cmd+V or Ctrl+V) to open the modal
    useHotkeys("meta+v", () => setOpen(true), {
        enableOnFormTags: true,
    });

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent
                className="overflow-hidden p-0 max-w-full w-full h-full md:max-w-[740px] md:h-[480px] m-0 rounded-2xl"
                hideClose
            >
                {/* <IncomeView /> */}
            </DialogContent>
        </Dialog>
    );
}
