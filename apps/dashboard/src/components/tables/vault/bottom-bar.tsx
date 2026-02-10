"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { motion } from "framer-motion";
import { Portal } from "@/components/portal";
import { useDownloadZip } from "@/hooks/use-download-zip";
import { useDocumentsStore } from "@/store/vault";

type Props = {
  data: string[];
};

export function BottomBar({ data }: Props) {
  const { rowSelection, setRowSelection } = useDocumentsStore();
  const { handleDownloadZip, isPending } = useDownloadZip();

  // Filter the data array based on the selected row indices (keys in rowSelection)
  const selectedFiles = data.filter((_, index) => rowSelection[index]);

  return (
    <Portal>
      <motion.div
        className="h-12 fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="relative pointer-events-auto min-w-[400px] h-12">
          {/* Blur layer fades in separately to avoid backdrop-filter animation issues */}
          <motion.div
            className="absolute inset-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <div className="relative h-12 justify-between items-center flex pl-4 pr-2">
            <span className="text-sm">
              {Object.keys(rowSelection).length} selected
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setRowSelection({})}
              >
                <span>Deselect all</span>
              </Button>

              <SubmitButton
                isSubmitting={isPending}
                onClick={() => handleDownloadZip(selectedFiles)}
              >
                <div className="flex items-center space-x-2">
                  <span>Download</span>
                  <Icons.ArrowCoolDown className="size-4" />
                </div>
              </SubmitButton>
            </div>
          </div>
        </div>
      </motion.div>
    </Portal>
  );
}
