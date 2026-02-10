"use client";

import { TZDate } from "@date-fns/tz";
import { formatEditorContent } from "@midday/invoice/format-to-html";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useFileUrl } from "@/hooks/use-file-url";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { CopyInput } from "./copy-input";
import { FormatAmount } from "./format-amount";
import { InvoiceSheetHeader } from "./invoice-sheet-header";
import { OpenURL } from "./open-url";

export function InvoiceSuccess() {
  const trpc = useTRPC();
  const { invoiceId, setParams } = useInvoiceParams();

  const { data: invoice } = useQuery(
    trpc.invoice.getById.queryOptions(
      {
        id: invoiceId!,
      },
      {
        enabled: !!invoiceId,
      },
    ),
  );

  const { url: downloadUrl } = useFileUrl({
    type: "invoice",
    invoiceId: invoiceId!,
  });

  if (!invoice) {
    return null;
  }

  return (
    <>
      <InvoiceSheetHeader invoiceId={invoiceId!} />

      <div className="flex flex-col justify-center h-[calc(100vh-260px)]">
        <div className="bg-[#F2F2F2] dark:bg-[#121212] p-6 relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex space-x-1 items-center">
              <div className="flex items-center">
                <span className="text-[11px] text-[#878787] font-mono">
                  {invoice.template.invoiceNoLabel}
                </span>
                <span className="text-[11px] text-[#878787] font-mono">:</span>
              </div>

              <span className="text-[11px]">{invoice.invoiceNumber}</span>
            </div>

            <div className="flex space-x-1 items-center">
              <div className="flex items-center">
                <span className="text-[11px] text-[#878787] font-mono">
                  {invoice.template.dueDateLabel}
                </span>
                <span className="text-[11px] text-[#878787] font-mono">:</span>
              </div>

              <span className="text-[11px]">
                {format(
                  new TZDate(invoice.dueDate!, "UTC"),
                  invoice.template.dateFormat,
                )}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span className="text-[11px] font-mono">
              {invoice.template.customerLabel}
            </span>
            <div className="text-[#878787]">
              {/* @ts-expect-error - customerDetails is JSONB */}
              {formatEditorContent(invoice.customerDetails)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="flex items-center justify-between mt-10 border-b border-border border-dashed pb-4"
          >
            <span className="text-[11px] text-[#878787] font-mono">
              {invoice.template.totalSummaryLabel}
            </span>

            <span className="text-xl">
              {invoice.amount && invoice.currency && (
                <FormatAmount
                  amount={invoice.amount}
                  currency={invoice.currency}
                />
              )}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="flex flex-col space-y-6 mt-10 mb-6"
          >
            <h2>Details</h2>

            {invoice.sentTo && (
              <div className="flex flex-col space-y-1">
                <span className="text-[11px] text-[#878787] font-mono">
                  Invoice sent to
                </span>
                <span className="text-sm">{invoice.sentTo}</span>
              </div>
            )}

            <div>
              <span className="text-[11px] text-[#878787] font-mono">
                Share link
              </span>
              <div className="flex w-full gap-2 mt-1">
                <div className="flex-1 min-w-0">
                  <CopyInput value={`${getUrl()}/i/${invoice.token}`} />
                </div>

                <Button
                  variant="secondary"
                  className="size-[40px] hover:bg-secondary shrink-0"
                  onClick={() => {
                    if (downloadUrl) {
                      downloadFile(downloadUrl, `${invoice.invoiceNumber}.pdf`);
                    }
                  }}
                  disabled={!downloadUrl}
                >
                  <div>
                    <Icons.ArrowCoolDown className="size-4" />
                  </div>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="flex flex-wrap gap-3 absolute -bottom-[15px] left-0 right-0 w-full justify-center"
          >
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index.toString()}
                className="size-[30px] rounded-full bg-[#fcfcfc] dark:bg-[#121212]"
              />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="flex mt-auto absolute bottom-6 justify-end gap-4 right-6 left-6">
        <OpenURL href={`${getUrl()}/i/${invoice.token}`}>
          <Button variant="secondary">View invoice</Button>
        </OpenURL>

        <Button
          onClick={() => {
            setParams(null);

            setTimeout(() => {
              setParams({ type: "create" });
            }, 600);
          }}
        >
          Create another
        </Button>
      </div>
    </>
  );
}
