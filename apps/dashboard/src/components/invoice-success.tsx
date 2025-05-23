"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { formatEditorContent } from "@midday/invoice/format-to-html";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
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

  if (!invoice) {
    return null;
  }

  return (
    <>
      <InvoiceSheetHeader
        type={
          // @ts-expect-error - template is JSONB
          invoice?.template?.deliveryType === "create_and_send"
            ? "created_and_sent"
            : "created"
        }
      />

      <div className="flex flex-col justify-center h-[calc(100vh-260px)]">
        <div className="bg-[#F2F2F2] dark:bg-background p-6 relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex space-x-1 items-center">
              <div className="flex items-center">
                <span className="text-[11px] text-[#878787] font-mono">
                  {/* @ts-expect-error - template is JSONB */}
                  {invoice.template.invoiceNoLabel}
                </span>
                <span className="text-[11px] text-[#878787] font-mono">:</span>
              </div>

              <span className="font-mono text-[11px]">
                {invoice.invoiceNumber}
              </span>
            </div>

            <div className="flex space-x-1 items-center">
              <div className="flex items-center">
                <span className="text-[11px] text-[#878787] font-mono">
                  {/* @ts-expect-error - template is JSONB */}
                  {invoice.template.dueDateLabel}
                </span>
                <span className="text-[11px] text-[#878787] font-mono">:</span>
              </div>

              <span className="font-mono text-[11px]">
                {format(
                  new Date(invoice.dueDate!),
                  // @ts-expect-error - template is JSONB
                  invoice.template.date_format,
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
              {/* @ts-expect-error - template is JSONB */}
              {invoice.template.customerLabel}
            </span>
            <div className="font-mono text-[#878787]">
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
              {/* @ts-expect-error - template is JSONB */}
              {invoice.template.totalSummaryLabel}
            </span>

            <span className="font-mono text-xl">
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

                <a
                  // @ts-expect-error - template is JSONB
                  href={`/api/download/invoice?id=${invoice.id}&size=${invoice.template.size}`}
                  download
                >
                  <Button
                    variant="secondary"
                    className="size-[40px] hover:bg-secondary shrink-0"
                  >
                    <div>
                      <Icons.ArrowCoolDown className="size-4" />
                    </div>
                  </Button>
                </a>
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
                className="size-[30px] rounded-full bg-background dark:bg-[#0C0C0C]"
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
