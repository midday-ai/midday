"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getWebsiteLogo } from "@/utils/logos";
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
import { cn } from "@midday/ui/cn";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { formatDate } from "@midday/utils/format";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTheme } from "next-themes";
import Link from "next/link";
import { type RefObject, useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { FormatAmount } from "./format-amount";
import { InvoiceStatus } from "./invoice-status";

// X (Twitter) icon with brand color (black)
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// LinkedIn icon with brand color (blue background, white text)
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 72"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue background */}
      <rect width="72" height="72" rx="8" fill="#0077B7" />
      {/* White "in" and icon */}
      <path
        fill="#fff"
        d="M20.5 29h8v28.5h-8zM24.5 17c2.7 0 4.9 2.2 4.9 4.9s-2.2 4.9-4.9 4.9-4.9-2.2-4.9-4.9 2.2-4.9 4.9-4.9M33.5 29h7.7v3.9h.1c1.1-2 3.7-4.1 7.6-4.1 8.1 0 9.6 5.3 9.6 12.3v14.4h-8V43.2c0-3.4-.1-7.8-4.8-7.8-4.8 0-5.5 3.7-5.5 7.6v14.5h-8V29z"
      />
    </svg>
  );
}

// Instagram icon with gradient
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="instagram-gradient"
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#F77737" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="75%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <path
        fill="url(#instagram-gradient)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      />
    </svg>
  );
}

// Facebook icon with brand color
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="#1877F2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// Format timezone with local time and relative difference
function formatTimezoneWithLocalTime(timezone: string): {
  localTime: string;
  relative: string;
  isOffHours: boolean;
} {
  try {
    const now = new Date();

    // Get the local time in the customer's timezone using user's locale
    const customerTime = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(now);

    // Calculate hour difference
    const customerDate = new Date(
      now.toLocaleString("en-US", { timeZone: timezone }),
    );
    const userDate = new Date(now.toLocaleString("en-US"));
    const diffMs = customerDate.getTime() - userDate.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    // Format relative time
    let relative: string;
    if (diffHours === 0) {
      relative = "same time";
    } else if (diffHours > 0) {
      relative = `${diffHours}h ahead`;
    } else {
      relative = `${Math.abs(diffHours)}h behind`;
    }

    // Check if it's off-hours (before 8am or after 8pm)
    const customerHour = new Date(
      now.toLocaleString("en-US", { timeZone: timezone }),
    ).getHours();
    const isOffHours = customerHour < 8 || customerHour >= 20;

    return { localTime: customerTime, relative, isOffHours };
  } catch {
    return { localTime: "", relative: "", isOffHours: false };
  }
}

export function CustomerDetails() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const { customerId, setParams } = useCustomerParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null!);

  const isOpen = customerId !== null;

  const {
    data: customer,
    isLoading: isLoadingCustomer,
    refetch,
  } = useQuery({
    ...trpc.customers.getById.queryOptions({ id: customerId! }),
    enabled: isOpen,
    placeholderData: keepPreviousData,
    staleTime: 0, // Always refetch when component mounts
  });

  // Mutation for re-enriching customer
  const enrichMutation = useMutation({
    ...trpc.customers.enrich.mutationOptions(),
    onSuccess: () => {
      // Refetch to get the processing status - no toast needed
      refetch();
    },
    onError: (error) => {
      toast({
        duration: 3000,
        variant: "destructive",
        title: "Enrichment failed",
        description: error.message,
      });
    },
  });

  // Mutation for cancelling enrichment
  const cancelEnrichmentMutation = useMutation({
    ...trpc.customers.cancelEnrichment.mutationOptions(),
    onSuccess: () => {
      refetch();
    },
  });

  const handleReEnrich = () => {
    if (customerId) {
      enrichMutation.mutate({ id: customerId });
    }
  };

  const handleCancelEnrich = () => {
    if (customerId) {
      cancelEnrichmentMutation.mutate({ id: customerId });
    }
  };

  const isEnriching =
    customer?.enrichmentStatus === "processing" || enrichMutation.isPending;

  // Subscribe to realtime updates for this customer
  useRealtime({
    channelName: `customer-${customerId}`,
    event: "UPDATE",
    table: "customers",
    filter: customerId ? `id=eq.${customerId}` : undefined,
    onEvent: (payload) => {
      // Refetch customer data when enrichment status changes
      if (payload.new && "enrichment_status" in payload.new) {
        refetch();
      }
    },
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
        {/* Header skeleton matching actual layout */}
        <div className="flex items-start gap-4 mb-6">
          <Skeleton className="size-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-[300px]" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i.toString()} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </div>
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

  // Check if customer has any enrichment data
  const hasEnrichmentData =
    customer?.description || customer?.industry || customer?.companyType;

  return (
    <div className="h-full flex flex-col min-h-0 -mx-6">
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
        {/* Sticky Customer Header - Enhanced with logo and enrichment */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
          <div className="flex items-start gap-4">
            {/* Logo from logo.dev */}
            {isEnriching ? (
              <Skeleton className="size-12 rounded-full flex-shrink-0" />
            ) : customer.website ? (
              <img
                src={getWebsiteLogo(customer.website)}
                alt={`${customer.name} logo`}
                className="size-12 rounded-full object-cover flex-shrink-0 bg-muted"
                onError={(e) => {
                  // Fallback to initials on error
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={cn(
                "size-12 rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium text-lg flex-shrink-0",
                customer.website && "hidden",
              )}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>

            {/* Name, description, and badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[24px] font-serif leading-normal truncate">
                  {customer.name}
                </div>
                {/* Re-enrich / Cancel button */}
                {customer.website && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {isEnriching ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs flex-shrink-0"
                            onClick={handleCancelEnrich}
                          >
                            <Icons.Close className="size-3 mr-1" />
                            Cancel
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="p-0 h-6 w-6 flex-shrink-0"
                            onClick={handleReEnrich}
                          >
                            <Icons.RefreshOutline className="size-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {isEnriching
                          ? "Cancel enrichment"
                          : "Refresh company data"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Description */}
              {isEnriching ? (
                <div className="mt-1 space-y-1">
                  <Skeleton className="h-4 w-full max-w-[280px]" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : customer.description ? (
                <p className="text-[13px] text-[#606060] mt-1 line-clamp-2">
                  {customer.description}
                </p>
              ) : null}

              {/* Badges */}
              {(customer.industry ||
                customer.companyType ||
                customer.employeeCount ||
                customer.fundingStage) && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {customer.industry && (
                    <Badge variant="tag-rounded">{customer.industry}</Badge>
                  )}
                  {customer.companyType && (
                    <Badge variant="tag-rounded">{customer.companyType}</Badge>
                  )}
                  {customer.employeeCount && (
                    <Badge variant="tag-rounded">
                      {customer.employeeCount} employees
                    </Badge>
                  )}
                  {customer.fundingStage && (
                    <Badge variant="tag-rounded">{customer.fundingStage}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <Accordion
            type="multiple"
            defaultValue={[
              "general",
              ...(hasEnrichmentData ? ["intelligence"] : []),
            ]}
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

            {/* Company Profile Section - Only show if we have enrichment data or it's processing */}
            {(hasEnrichmentData ||
              isEnriching ||
              customer.enrichmentStatus === "completed") && (
              <AccordionItem
                value="intelligence"
                className="border-b border-border"
              >
                <AccordionTrigger className="text-[16px] font-medium py-4">
                  Company Profile
                </AccordionTrigger>
                <AccordionContent>
                  {isEnriching ? (
                    <div className="grid grid-cols-2 gap-4 pt-0">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={`skeleton-${i.toString()}`}
                          className="space-y-2"
                        >
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-5 w-28" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pt-0">
                      {customer.industry && (
                        <div>
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Industry
                          </div>
                          <div className="text-[14px]">{customer.industry}</div>
                        </div>
                      )}
                      {customer.companyType && (
                        <div>
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Company Type
                          </div>
                          <div className="text-[14px]">
                            {customer.companyType}
                          </div>
                        </div>
                      )}
                      {customer.employeeCount && (
                        <div>
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Employees
                          </div>
                          <div className="text-[14px]">
                            {customer.employeeCount}
                          </div>
                        </div>
                      )}
                      {customer.foundedYear && (
                        <div>
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Founded
                          </div>
                          <div className="text-[14px]">
                            {customer.foundedYear}
                          </div>
                        </div>
                      )}
                      {customer.estimatedRevenue && (
                        <div>
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Est. Revenue
                          </div>
                          <div className="text-[14px]">
                            {customer.estimatedRevenue}
                          </div>
                        </div>
                      )}
                      {(customer.fundingStage || customer.totalFunding) && (
                        <div>
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Funding
                          </div>
                          <div className="text-[14px]">
                            {customer.fundingStage}
                            {customer.totalFunding &&
                              ` (${customer.totalFunding})`}
                          </div>
                        </div>
                      )}
                      {customer.headquartersLocation && (
                        <div>
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Headquarters
                          </div>
                          <div className="text-[14px]">
                            {customer.headquartersLocation}
                          </div>
                        </div>
                      )}
                      {customer.timezone &&
                        (() => {
                          const tz = formatTimezoneWithLocalTime(
                            customer.timezone,
                          );
                          return (
                            <div>
                              <div className="text-[12px] mb-2 text-[#606060]">
                                Local Time
                              </div>
                              <div className="text-[14px] flex items-center gap-1.5">
                                {tz.isOffHours && <span>🌙</span>}
                                <span>{tz.localTime}</span>
                                <span className="text-[#878787]">
                                  ({tz.relative})
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      {/* Social Links */}
                      {(customer.linkedinUrl ||
                        customer.twitterUrl ||
                        customer.instagramUrl ||
                        customer.facebookUrl ||
                        customer.website) && (
                        <div className="col-span-2">
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Links
                          </div>
                          <div className="flex items-center gap-3">
                            {customer.linkedinUrl && (
                              <a
                                href={customer.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <LinkedInIcon className="size-4" />
                              </a>
                            )}
                            {customer.twitterUrl && (
                              <a
                                href={customer.twitterUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground hover:opacity-70 transition-opacity"
                              >
                                <XIcon className="size-4" />
                              </a>
                            )}
                            {customer.instagramUrl && (
                              <a
                                href={customer.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <InstagramIcon className="size-4" />
                              </a>
                            )}
                            {customer.facebookUrl && (
                              <a
                                href={customer.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <FacebookIcon className="size-4" />
                              </a>
                            )}
                            {customer.website && (
                              <a
                                href={
                                  customer.website.startsWith("http")
                                    ? customer.website
                                    : `https://${customer.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Icons.Globle className="size-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Show enrichment status if not completed and no data */}
                      {!hasEnrichmentData &&
                        customer.enrichmentStatus === "completed" && (
                          <div className="col-span-2 text-[14px] text-[#606060]">
                            No company information found.
                            {customer.website && " Try refreshing the data."}
                          </div>
                        )}
                      {customer.enrichmentStatus === "failed" && (
                        <div className="col-span-2 text-[14px] text-[#606060]">
                          Failed to fetch company information.
                          {customer.website && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-[14px] ml-1"
                              onClick={handleReEnrich}
                            >
                              Try again
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

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
