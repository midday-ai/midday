"use client";

import { downloadFile } from "@/lib/download";
import { useInvoiceStore } from "@/store/invoice";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Invoice } from "./columns";

type Props = {
  data: Invoice[];
};

export function BottomBar({ data }: Props) {
  const { rowSelection, setRowSelection } = useInvoiceStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
  });

  // Filter the data array based on the selected row IDs (keys in rowSelection)
  const selectedInvoices = data.filter((invoice) => rowSelection[invoice.id]);
  const downloadableInvoices = selectedInvoices; // Allow downloading all selected invoices including drafts

  const handleBulkDownload = async () => {
    if (downloadableInvoices.length === 0) {
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: downloadableInvoices.length });

    // Add a small delay to ensure the spinner shows up
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Download each selected invoice
      let currentIndex = 0;
      for (const invoice of downloadableInvoices) {
        currentIndex++;
        setDownloadProgress({
          current: currentIndex,
          total: downloadableInvoices.length,
        });

        try {
          await downloadFile(
            `/api/download/invoice?id=${invoice.id}`,
            `${invoice.invoiceNumber || "invoice"}.pdf`,
          );
        } catch (downloadError) {
          // Continue with next invoice instead of stopping
        }

        // Add a delay between downloads to avoid overwhelming the browser
        // and to show the spinner for a better user experience
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      // Handle any unexpected errors silently
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <motion.div
      className="h-12 fixed bottom-4 left-0 right-0 pointer-events-none flex justify-center z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="pointer-events-auto backdrop-filter min-w-[400px] backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C] border-[#DCDAD2]">
        <span className="text-sm text-[#878787]">
          <NumberFlow value={Object.keys(rowSelection).length} /> selected
        </span>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => setRowSelection({})}>
            <span>Deselect all</span>
          </Button>

          <SubmitButton
            isSubmitting={isDownloading || downloadProgress.current > 0}
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
