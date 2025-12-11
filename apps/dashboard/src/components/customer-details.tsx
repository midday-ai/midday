"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import {
  generateStatementPdf,
  generateStatementPdfBlob,
} from "@/utils/statement-to-pdf";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { SheetFooter } from "@midday/ui/sheet";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { formatDate } from "@midday/utils/format";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import Link from "next/link";
import { type RefObject, useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { FormatAmount } from "./format-amount";
import { InvoiceStatus } from "./invoice-status";

export function CustomerDetails() {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { customerId, setParams } = useCustomerParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null!);

  const isOpen = customerId !== null;

  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    ...trpc.customers.getById.queryOptions({ id: customerId! }),
    enabled: isOpen,
  });

  const infiniteQueryOptions = trpc.invoice.get.infiniteQueryOptions(
    {
      customers: customerId ? [customerId] : undefined,
      pageSize: 5,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const {
    data: invoicesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...infiniteQueryOptions,
    enabled: isOpen,
  });

  const invoices = useMemo(() => {
    return invoicesData?.pages.flatMap((page) => page.data) ?? [];
  }, [invoicesData]);

  // Get invoice summary from server
  const { data: summary } = useQuery({
    ...trpc.customers.getInvoiceSummary.queryOptions({ id: customerId! }),
    enabled: isOpen && Boolean(customerId),
  });

  useOnClickOutside(dropdownContainerRef as RefObject<HTMLElement>, () => {
    setOpenDropdownId(null);
  });

  const handleDownloadInvoice = (invoiceId: string) => {
    if (!user?.fileKey) {
      console.error("File key not available");
      return;
    }
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice`,
    );
    url.searchParams.set("id", invoiceId);
    url.searchParams.set("fk", user.fileKey);
    downloadFile(url.toString(), "invoice.pdf");
    setOpenDropdownId(null);
  };

  if (isLoadingCustomer) {
    return (
      <div className="h-full px-6 pt-6 pb-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-4 w-32 mb-4" />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleEdit = () => {
    setParams({ customerId: customerId!, details: null });
  };

  const filename = customer
    ? `${customer.name.toLowerCase().replace(/\s+/g, "-")}-statement.pdf`
    : "statement.pdf";

  const handleDownloadStatement = async () => {
    try {
      await generateStatementPdf({
        filename,
        theme: resolvedTheme,
      });
    } catch {}
  };

  const handleShareStatement = async () => {
    try {
      // Check if Web Share API is available
      if (!navigator.share) {
        // Fallback to download if Web Share API is not supported
        await handleDownloadStatement();
        return;
      }

      // Generate PDF blob silently
      const blob = await generateStatementPdfBlob({
        filename,
        theme: resolvedTheme,
      });

      // Create File object from blob
      const file = new File([blob], filename, {
        type: "application/pdf",
      });

      // Share using Web Share API
      await navigator.share({
        title: `${customer?.name} Statement`,
        files: [file],
      });
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          duration: 2500,
          title: "Failed to share statement",
          description: "Please try downloading the statement instead.",
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 -mx-6">
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
        {/* Sticky Customer Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
          <div className="text-[24px] font-serif leading-normal">
            {customer.name}
          </div>
        </div>

        <div className="px-6 pb-4">
          <Accordion
            type="multiple"
            defaultValue={["general"]}
            className="space-y-0"
          >
            {/* General Section */}
            <AccordionItem value="general" className="border-b border-border">
              <AccordionTrigger className="text-[16px] font-medium py-4">
                General
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-0">
                  {customer.contact && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Contact person
                      </div>
                      <div className="text-[14px]">{customer.contact}</div>
                    </div>
                  )}
                  {customer.email && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Email
                      </div>
                      <div className="text-[14px]">{customer.email}</div>
                    </div>
                  )}
                  {customer.billingEmail && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Billing Email
                      </div>
                      <div className="text-[14px]">{customer.billingEmail}</div>
                    </div>
                  )}
                  {customer.phone && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Phone
                      </div>
                      <div className="text-[14px]">{customer.phone}</div>
                    </div>
                  )}
                  {customer.website && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Website
                      </div>
                      <div className="text-[14px]">{customer.website}</div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Details Section */}
            <AccordionItem value="details" className="border-b border-border">
              <AccordionTrigger className="text-[16px] font-medium py-4">
                Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-0">
                  {customer.addressLine1 ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Address
                      </div>
                      <div className="text-[14px]">
                        {customer.addressLine1}
                        {customer.addressLine2 && `, ${customer.addressLine2}`}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Address
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {customer.city ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        City
                      </div>
                      <div className="text-[14px]">{customer.city}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        City
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {customer.state ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        State
                      </div>
                      <div className="text-[14px]">{customer.state}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        State
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {customer.zip ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        ZIP Code
                      </div>
                      <div className="text-[14px]">{customer.zip}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        ZIP Code
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {customer.country ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Country
                      </div>
                      <div className="text-[14px]">{customer.country}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Country
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {customer.vatNumber ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        VAT Number
                      </div>
                      <div className="text-[14px]">{customer.vatNumber}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        VAT Number
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {customer.note ? (
                    <div className="col-span-2">
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Note
                      </div>
                      <div className="text-[14px]">{customer.note}</div>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Note
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {customer.tags && customer.tags.length > 0 ? (
                    <div className="col-span-2">
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Tags
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {customer.tags.map((tag) => (
                          <Link
                            href={`/transactions?tags=${tag.id}`}
                            key={tag.id}
                          >
                            <Badge
                              variant="tag-rounded"
                              className="whitespace-nowrap"
                            >
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Tags
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Statement Section */}
          <div className="border-t border-border pt-6 mt-6">
            {/* Statement Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-medium">Statement</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-0 h-6 w-6">
                    <Icons.MoreVertical
                      size={15}
                      className="text-muted-foreground"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[100]">
                  <DropdownMenuItem
                    onClick={handleShareStatement}
                    className="text-xs"
                  >
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDownloadStatement}
                    className="text-xs"
                  >
                    Download
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Statement Content */}
            <div data-statement-content>
              {/* Company Title - Only visible in PDF */}
              <div
                className="hidden text-[32px] font-serif leading-normal mb-8"
                data-show-in-pdf="true"
              >
                {customer.name}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-border px-4 py-3">
                  <div className="text-[12px] text-[#606060] mb-2">
                    Total Amount
                  </div>
                  <div className="text-[18px] font-medium">
                    {summary?.currency ? (
                      <FormatAmount
                        amount={summary.totalAmount}
                        currency={summary.currency}
                      />
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div className="border border-border px-4 py-3">
                  <div className="text-[12px] text-[#606060] mb-2">Paid</div>
                  <div className="text-[18px] font-medium">
                    {summary?.currency ? (
                      <FormatAmount
                        amount={summary.paidAmount}
                        currency={summary.currency}
                      />
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div className="border border-border px-4 py-3">
                  <div className="text-[12px] text-[#606060] mb-2">
                    Outstanding
                  </div>
                  <div className="text-[18px] font-medium">
                    {summary?.currency ? (
                      <FormatAmount
                        amount={summary.outstandingAmount}
                        currency={summary.currency}
                      />
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div className="border border-border px-4 py-3">
                  <div className="text-[12px] text-[#606060] mb-2">
                    Invoices
                  </div>
                  <div className="text-[18px] font-medium">
                    {summary?.invoiceCount ?? 0}
                  </div>
                </div>
              </div>

              {/* Invoice Table */}
              {invoices.length > 0 ? (
                <div ref={dropdownContainerRef}>
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-[12px] font-medium text-[#606060]">
                          Invoice
                        </TableHead>
                        <TableHead className="text-[12px] font-medium text-[#606060]">
                          Date
                        </TableHead>
                        <TableHead className="text-[12px] font-medium text-[#606060]">
                          Due Date
                        </TableHead>
                        <TableHead className="text-[12px] font-medium text-[#606060]">
                          Amount
                        </TableHead>
                        <TableHead className="text-[12px] font-medium text-[#606060]">
                          Status
                        </TableHead>
                        <TableHead
                          className="text-[12px] font-medium text-[#606060] text-center w-[60px]"
                          data-hide-in-pdf="true"
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow
                          key={invoice.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            // Close customer details sheet
                            setParams({ customerId: null, details: null });
                            // Open invoice details
                            setInvoiceParams({
                              invoiceId: invoice.id,
                              type: "details",
                            });
                          }}
                        >
                          <TableCell className="text-[12px] whitespace-nowrap min-w-[100px]">
                            {invoice.invoiceNumber || "Draft"}
                          </TableCell>
                          <TableCell className="text-[12px] whitespace-nowrap">
                            {invoice.issueDate
                              ? formatDate(invoice.issueDate, "MMM d")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-[12px] whitespace-nowrap">
                            {invoice.dueDate
                              ? formatDate(invoice.dueDate, "MMM d")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-[12px] whitespace-nowrap">
                            {invoice.amount != null && invoice.currency ? (
                              <FormatAmount
                                amount={invoice.amount}
                                currency={invoice.currency}
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-[12px] whitespace-nowrap">
                            <InvoiceStatus
                              status={invoice.status as any}
                              className="text-xs"
                              textOnly
                            />
                          </TableCell>
                          <TableCell
                            className="text-center w-[60px]"
                            data-hide-in-pdf="true"
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="text-[#606060] hover:text-foreground transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <Icons.MoreHoriz className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="z-[100]"
                              >
                                {invoice.status !== "draft" ? (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadInvoice(invoice.id);
                                    }}
                                  >
                                    Download
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled>
                                    No actions available
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="text-center mb-6 space-y-2">
                      <h2 className="font-medium text-sm">No invoices</h2>
                      <p className="text-[#606060] text-xs">
                        This customer doesn't have any invoices yet. <br />
                        Create your first invoice for them.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        // Close customer details sheet
                        setParams({ customerId: null, details: null });
                        // Open invoice creation with customer pre-selected
                        setInvoiceParams({
                          type: "create",
                          selectedCustomerId: customerId!,
                        });
                      }}
                    >
                      Create Invoice
                    </Button>
                  </div>
                </div>
              )}

              {/* Load More Button */}
              {hasNextPage && (
                <Button
                  variant="outline"
                  className="w-full mt-4 rounded-none"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  data-hide-in-pdf="true"
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <SheetFooter className="border-t border-border pt-4 mt-auto flex-shrink-0 w-full mx-0">
        <div className="w-full px-6 flex justify-end">
          <Button
            onClick={handleEdit}
            variant="secondary"
            className="rounded-none"
          >
            Edit
          </Button>
        </div>
      </SheetFooter>
    </div>
  );
}
