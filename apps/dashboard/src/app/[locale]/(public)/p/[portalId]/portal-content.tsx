"use client";

import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { formatAmount } from "@midday/utils/format";
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import JSZip from "jszip";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { InvoiceStatus } from "@/components/invoice-status";
import { downloadFile } from "@/lib/download";
import { saveFile } from "@/lib/save-file";
import { useTRPC } from "@/trpc/client";

type Props = {
  portalId: string;
};

export function PortalContent({ portalId }: Props) {
  const trpc = useTRPC();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch customer and summary data
  const { data: portalData } = useSuspenseQuery(
    trpc.customers.getByPortalId.queryOptions({ portalId }),
  );

  // Fetch invoices with infinite query
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.customers.getPortalInvoices.infiniteQueryOptions(
        { portalId },
        {
          getNextPageParam: ({ meta }) => meta?.cursor,
        },
      ),
    );

  const customer = portalData?.customer;
  const summary = portalData?.summary;

  const invoices = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  if (!customer || !summary) {
    return null;
  }

  const allSelected =
    invoices.length > 0 && selectedIds.size === invoices.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < invoices.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((inv) => inv.id)));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDownloadSingle = async (invoice: (typeof invoices)[number]) => {
    setDownloadingId(invoice.id);
    try {
      downloadFile(
        `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?token=${invoice.token}`,
        `${invoice.invoiceNumber || "invoice"}.pdf`,
      );
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  const handleDownloadSelected = async () => {
    const selected = invoices.filter((inv) => selectedIds.has(inv.id));
    if (selected.length === 0) return;

    if (selected.length === 1) {
      await handleDownloadSingle(selected[0]!);
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const usedFilenames = new Set<string>();

      const filePromises = selected.map(async (invoice) => {
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?token=${invoice.token}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch invoice ${invoice.id}`);
          }

          const blob = await response.blob();
          const baseName = invoice.invoiceNumber ?? `invoice-${invoice.id}`;
          let filename = `${baseName}.pdf`;
          let counter = 1;
          while (usedFilenames.has(filename)) {
            filename = `${baseName}-${counter}.pdf`;
            counter++;
          }
          usedFilenames.add(filename);
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Error processing invoice ${invoice.id}:`, error);
        }
      });

      await Promise.all(filePromises);

      const fileCount = Object.keys(zip.files).length;
      if (fileCount === 0) {
        throw new Error("No invoices could be downloaded.");
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      const timestamp = new Date().toISOString().split("T")[0];
      await saveFile(zipBlob, `invoices-${timestamp}.zip`);
    } catch (error) {
      console.error("Failed to create invoice ZIP:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen dotted-bg">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          {customer.team.logoUrl && (
            <div className="mb-6">
              <Image
                src={customer.team.logoUrl}
                alt={customer.team.name || "Company logo"}
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          )}
          <h1 className="text-2xl font-serif tracking-tight">
            {customer.name}
          </h1>
          {customer.team.name && (
            <p className="text-sm text-[#606060] mt-1">{customer.team.name}</p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="bg-background border border-border px-4 py-3">
            <div className="text-[12px] text-[#606060] mb-2">Total Amount</div>
            <div className="text-[18px] font-medium">
              {formatAmount({
                amount: summary.totalAmount,
                currency: summary.currency,
              })}
            </div>
          </div>
          <div className="bg-background border border-border px-4 py-3">
            <div className="text-[12px] text-[#606060] mb-2">Paid</div>
            <div className="text-[18px] font-medium">
              {formatAmount({
                amount: summary.paidAmount,
                currency: summary.currency,
              })}
            </div>
          </div>
          <div className="bg-background border border-border px-4 py-3">
            <div className="text-[12px] text-[#606060] mb-2">Outstanding</div>
            <div className="text-[18px] font-medium">
              {formatAmount({
                amount: summary.outstandingAmount,
                currency: summary.currency,
              })}
            </div>
          </div>
          <div className="bg-background border border-border px-4 py-3">
            <div className="text-[12px] text-[#606060] mb-2">Invoices</div>
            <div className="text-[18px] font-medium">
              {summary.invoiceCount}
            </div>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="mb-6">
          <h2 className="text-[16px] font-medium mb-4">Invoices</h2>
        </div>

        {/* Invoice Table */}
        {invoices.length > 0 ? (
          <div className="bg-background border border-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[32px_minmax(80px,1.2fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(60px,0.8fr)_32px] gap-2 px-3 py-3 bg-muted/50 border-b border-border text-[12px] font-medium text-[#606060] items-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={toggleAll}
                />
              </div>
              <div>Invoice</div>
              <div>Date</div>
              <div>Due Date</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Status</div>
              <div />
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="grid grid-cols-[32px_minmax(80px,1.2fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(60px,0.8fr)_32px] gap-2 px-3 py-3 hover:bg-muted/50 transition-colors group items-center"
                >
                  <div
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.has(invoice.id)}
                      onCheckedChange={() => toggleOne(invoice.id)}
                    />
                  </div>
                  <Link
                    href={`/i/${invoice.token}`}
                    target="_blank"
                    className="text-[12px] hover:underline"
                  >
                    {invoice.invoiceNumber || "-"}
                  </Link>
                  <div className="text-[12px] text-[#606060]">
                    {invoice.issueDate
                      ? format(
                          new TZDate(invoice.issueDate, "UTC"),
                          "MMM d, yyyy",
                        )
                      : "-"}
                  </div>
                  <div className="text-[12px] text-[#606060]">
                    {invoice.dueDate
                      ? format(
                          new TZDate(invoice.dueDate, "UTC"),
                          "MMM d, yyyy",
                        )
                      : "-"}
                  </div>
                  <div className="text-[12px] text-right">
                    {invoice.amount != null && invoice.currency
                      ? formatAmount({
                          amount: invoice.amount,
                          currency: invoice.currency,
                        })
                      : "-"}
                  </div>
                  <div className="text-right">
                    <InvoiceStatus status={invoice.status as any} />
                  </div>
                  <div className="flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          {downloadingId === invoice.id ? (
                            <Spinner size={16} />
                          ) : (
                            <Icons.MoreHoriz className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/i/${invoice.token}`} target="_blank">
                            View invoice
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownloadSingle(invoice)}
                        >
                          Download
                        </DropdownMenuItem>
                        {invoice.status === "paid" && (
                          <DropdownMenuItem
                            onClick={() => {
                              downloadFile(
                                `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?token=${invoice.token}&type=receipt`,
                                `receipt-${invoice.invoiceNumber || "invoice"}.pdf`,
                              );
                            }}
                          >
                            Download receipt
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-background border border-border py-16 text-center">
            <p className="text-[#606060]">No invoices yet</p>
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full text-xs text-[#606060] bg-background"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  <span>Loading...</span>
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 right-4 hidden md:block">
        <a
          href="https://midday.ai?utm_source=customer-portal"
          target="_blank"
          rel="noreferrer"
          className="text-[9px] text-[#878787]"
        >
          Powered by <span className="text-primary">midday</span>
        </a>
      </div>

      {/* Bottom Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            className="h-12 fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-50"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative pointer-events-auto min-w-[400px] h-12">
              <motion.div
                className="absolute inset-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
              <div className="relative h-12 justify-between items-center flex pl-4 pr-2">
                <span className="text-sm">{selectedIds.size} selected</span>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    <span>Deselect all</span>
                  </Button>

                  <Button
                    onClick={handleDownloadSelected}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <div className="flex items-center space-x-2">
                        <Spinner size={16} />
                        <span>Downloading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Download</span>
                        <Icons.ArrowCoolDown className="size-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
