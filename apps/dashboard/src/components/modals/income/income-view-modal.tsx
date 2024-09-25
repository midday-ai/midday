"use client";

import { FeatureInDevelopment } from "@/components/feature-in-development";
import { UpgradeTier } from "@/components/upgrade-tier";
import { useIncomeViewStore } from "@/store/income-view";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import dynamic from "next/dynamic";
import { useHotkeys } from "react-hotkeys-hook";

/**
 * IncomeViewModal Component
 *
 * This component renders a modal dialog that displays the ClientIncomeView component.
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
        className="overflow-hidden p-0 max-w-full w-full h-full md:min-h-[60%] md:max-h-[75%] md:min-w-[60%] md:max-w-[75%] m-0 rounded-2xl"
        hideClose
      >
        <FeatureInDevelopment
          featureName="Quick Access Income View"
          isDisabled={true}
        />
      </DialogContent>
    </Dialog>
  );
}
