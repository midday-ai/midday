"use client";

import { useDownloadInvoicesZip } from "@/hooks/use-download-invoices-zip";
import { useInvoiceStore } from "@/store/invoice";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import type { Invoice } from "./columns";

type Props = {
  data: Invoice[];
};

export function BottomBar({ data }: Props) {
  const { rowSelection, setRowSelection } = useInvoiceStore();
  const { handleDownloadZip, isPending, progress } = useDownloadInvoicesZip();

  // Filter the data array based on the selected row IDs (keys in rowSelection)
  const selectedInvoices = data.filter((invoice) => rowSelection[invoice.id]);
  const downloadableInvoices = selectedInvoices; // Allow downloading all selected invoices including drafts

  const handleBulkDownload = async () => {
    if (downloadableInvoices.length === 0) {
      return;
    }

    await handleDownloadZip(downloadableInvoices);
  };

  return (
    <motion.div
      className="h-12 fixed bottom-4 left-0 right-0 pointer-events-none flex justify-center z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="pointer-events-auto backdrop-filter min-w-[400px] backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex pl-2 pr-1 border dark:border-[#2C2C2C] border-[#DCDAD2]">
        <span className="text-sm text-[#878787]">
          <NumberFlow value={Object.keys(rowSelection).length} /> selected
        </span>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => setRowSelection({})}>
            <span>Deselect all</span>
          </Button>

          <SubmitButton
            isSubmitting={isPending || progress.current > 0}
            onClick={handleBulkDownload}
            disabled={downloadableInvoices.length === 0}
          >
            <div className="flex items-center space-x-2">
              <span>
                Download{" "}
                {downloadableInvoices.length > 0
                  ? `(${downloadableInvoices.length})`
                  : ""}
              </span>
              <Icons.ArrowCoolDown className="size-4" />
            </div>
          </SubmitButton>
        </div>
      </div>
    </motion.div>
  );
}
