"use client";

import { TZDate } from "@date-fns/tz";
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
import { SheetFooter, SheetHeader } from "@midday/ui/sheet";
import { Skeleton } from "@midday/ui/skeleton";
import { Switch } from "@midday/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyInput } from "@/components/copy-input";
import { OpenURL } from "@/components/open-url";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getWebsiteLogo } from "@/utils/logos";
import { CustomerDetailsSkeleton } from "./customer-details.loading";
import { FormatAmount } from "./format-amount";
import { InvoiceStatus } from "./invoice-status";

// Format timezone with local time and relative difference
function formatTimezoneWithLocalTime(timezone: string): {
  localTime: string;
  relative: string;
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

    return { localTime: customerTime, relative };
  } catch {
    return { localTime: "", relative: "" };
  }
}

export function CustomerDetails() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const { customerId, setParams } = useCustomerParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { toast } = useToast();
  const dropdownContainerRef = useRef<HTMLDivElement>(null!);

  // Track enrichment animation - use a key that changes when enrichment completes
  const [enrichmentAnimationKey, setEnrichmentAnimationKey] = useState(0);
  const prevEnrichmentStatusRef = useRef<string | null>(null);

  const isOpen = customerId !== null;

  // Toggle portal mutation
  const togglePortalMutation = useMutation(
    trpc.customers.togglePortal.mutationOptions({
      onSuccess: () => {
        // Invalidate customer query to refresh portal data
        queryClient.invalidateQueries({
          queryKey: trpc.customers.getById.queryKey({ id: customerId! }),
        });
      },
      onError: () => {
        toast({
          title: "Failed to update customer portal",
          description: "Please try again.",
          duration: 2500,
        });
      },
    }),
  );

  const {
    data: customer,
    isLoading: isLoadingCustomer,
    refetch,
  } = useQuery({
    ...trpc.customers.getById.queryOptions({ id: customerId! }),
    enabled: isOpen,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds - prevents excessive refetches when reopening
  });

  // Mutation for re-enriching customer
  const enrichMutation = useMutation(
    trpc.customers.enrich.mutationOptions({
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.customers.getById.queryKey({ id: customerId! }),
        });

        // Optimistically update to pending status
        queryClient.setQueryData(
          trpc.customers.getById.queryKey({ id: customerId! }),
          (old: typeof customer) =>
            old ? { ...old, enrichmentStatus: "pending" as const } : old,
        );
      },
      onError: (error) => {
        toast({
          duration: 3000,
          variant: "destructive",
          title: "Enrichment failed",
          description: error.message,
        });
      },
      onSettled: () => {
        // Refetch after mutation settles
        refetch();
      },
    }),
  );

  // Mutation for cancelling enrichment
  const cancelEnrichmentMutation = useMutation({
    ...trpc.customers.cancelEnrichment.mutationOptions(),
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation for clearing enrichment data
  const clearEnrichmentMutation = useMutation({
    ...trpc.customers.clearEnrichment.mutationOptions(),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        duration: 3000,
        variant: "destructive",
        title: "Failed to clear data",
        description: error.message,
      });
    },
  });

  const handleStartEnrich = () => {
    if (customerId) {
      enrichMutation.mutate({ id: customerId });
    }
  };

  const handleCancelEnrich = () => {
    if (customerId) {
      cancelEnrichmentMutation.mutate({ id: customerId });
    }
  };

  const handleClearEnrichment = () => {
    if (customerId) {
      clearEnrichmentMutation.mutate({ id: customerId });
    }
  };

  const isEnriching =
    customer?.enrichmentStatus === "pending" ||
    customer?.enrichmentStatus === "processing" ||
    enrichMutation.isPending;

  // Track enrichment status changes to trigger animation only when transitioning from loading to complete
  useEffect(() => {
    const prevStatus = prevEnrichmentStatusRef.current;
    const currentStatus = customer?.enrichmentStatus;

    // Increment key to trigger animation when transitioning from pending/processing to completed
    if (
      (prevStatus === "pending" || prevStatus === "processing") &&
      currentStatus === "completed"
    ) {
      setEnrichmentAnimationKey((k) => k + 1);
    }

    prevEnrichmentStatusRef.current = currentStatus ?? null;
  }, [customer?.enrichmentStatus]);

  // Reset animation state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      prevEnrichmentStatusRef.current = null;
    }
  }, [isOpen]);

  // Subscribe to realtime updates for this customer
  useRealtime({
    channelName: "realtime_customers",
    events: ["UPDATE"],
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
  };

  if (isLoadingCustomer) {
    return <CustomerDetailsSkeleton />;
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

  // Check if customer has any enrichment data
  const hasEnrichmentData =
    customer?.description ||
    customer?.industry ||
    customer?.companyType ||
    customer?.employeeCount ||
    customer?.fundingStage;

  return (
    <div className="h-full flex flex-col min-h-0 -mx-6">
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
        {/* Sheet Header - matches other sheets */}
        <SheetHeader className="flex justify-between items-center flex-row px-6 mb-4">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            {/* Logo from logo.dev */}
            {isEnriching ? (
              <Skeleton className="size-9 rounded-full flex-shrink-0" />
            ) : customer.website ? (
              <img
                src={getWebsiteLogo(customer.website)}
                alt={`${customer.name} logo`}
                className="size-9 rounded-full object-cover flex-shrink-0 bg-muted"
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
                "size-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium flex-shrink-0",
                customer.website && "hidden",
              )}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-serif truncate">{customer.name}</h2>
          </div>

          {/* Actions menu */}
          {customer.website && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <Icons.MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isEnriching ? (
                  <DropdownMenuItem onClick={handleCancelEnrich}>
                    <Icons.Close className="size-4 mr-2" />
                    Cancel enrichment
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleStartEnrich}>
                    <Icons.RefreshOutline className="size-4 mr-2" />
                    {hasEnrichmentData ? "Refresh data" : "Enrich company"}
                  </DropdownMenuItem>
                )}
                {hasEnrichmentData && !isEnriching && (
                  <DropdownMenuItem
                    onClick={handleClearEnrichment}
                    className="text-destructive"
                  >
                    <Icons.Delete className="size-4 mr-2" />
                    Clear enrichment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SheetHeader>

        {/* Company info section */}
        {(customer.description ||
          customer.industry ||
          customer.companyType ||
          customer.employeeCount ||
          customer.fundingStage ||
          isEnriching) && (
          <div className="px-6 pb-4 border-b border-border">
            {/* Description */}
            {isEnriching ? (
              <div className="space-y-1.5">
                <Skeleton className="h-[13px] w-full" />
                <Skeleton className="h-[13px] w-4/5" />
              </div>
            ) : customer.description ? (
              <p className="text-[13px] text-[#606060] line-clamp-2">
                {customer.description}
              </p>
            ) : null}

            {/* Badges */}
            {isEnriching ? (
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ) : customer.industry ||
              customer.companyType ||
              customer.employeeCount ||
              customer.fundingStage ? (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {customer.industry && (
                  <Badge variant="tag">{customer.industry}</Badge>
                )}
                {customer.companyType && (
                  <Badge variant="tag">{customer.companyType}</Badge>
                )}
                {customer.employeeCount && (
                  <Badge variant="tag">
                    {customer.employeeCount} employees
                  </Badge>
                )}
                {customer.fundingStage && (
                  <Badge variant="tag">{customer.fundingStage}</Badge>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="px-6 pb-4">
          <Accordion
            type="multiple"
            defaultValue={["general", "profile"]}
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

            {/* Company Profile Section - Only show if we have enrichment data, it's processing, or failed */}
            {(hasEnrichmentData ||
              isEnriching ||
              customer.enrichmentStatus === "completed" ||
              customer.enrichmentStatus === "failed") && (
              <AccordionItem value="profile" className="border-b border-border">
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
                    <motion.div
                      key={enrichmentAnimationKey}
                      className="grid grid-cols-2 gap-4 pt-0"
                      initial={enrichmentAnimationKey > 0 ? "hidden" : false}
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren:
                              enrichmentAnimationKey > 0 ? 0.02 : 0,
                            delayChildren: 0,
                          },
                        },
                      }}
                    >
                      {customer.industry && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Industry
                          </div>
                          <div className="text-[14px]">{customer.industry}</div>
                        </motion.div>
                      )}
                      {customer.companyType && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Company Type
                          </div>
                          <div className="text-[14px]">
                            {customer.companyType}
                          </div>
                        </motion.div>
                      )}
                      {customer.employeeCount && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Employees
                          </div>
                          <div className="text-[14px]">
                            {customer.employeeCount}
                          </div>
                        </motion.div>
                      )}
                      {customer.foundedYear && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Founded
                          </div>
                          <div className="text-[14px]">
                            {customer.foundedYear}
                          </div>
                        </motion.div>
                      )}
                      {customer.estimatedRevenue && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Est. Revenue
                          </div>
                          <div className="text-[14px]">
                            {customer.estimatedRevenue}
                          </div>
                        </motion.div>
                      )}
                      {(customer.fundingStage || customer.totalFunding) && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Funding
                          </div>
                          <div className="text-[14px]">
                            {customer.fundingStage}
                            {customer.totalFunding &&
                              ` (${customer.totalFunding})`}
                          </div>
                        </motion.div>
                      )}
                      {customer.headquartersLocation && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Headquarters
                          </div>
                          <div className="text-[14px]">
                            {customer.headquartersLocation}
                          </div>
                        </motion.div>
                      )}
                      {customer.ceoName && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            CEO / Founder
                          </div>
                          <div className="text-[14px]">{customer.ceoName}</div>
                        </motion.div>
                      )}
                      {(customer.financeContact ||
                        customer.financeContactEmail) && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Finance Contact
                          </div>
                          <div className="text-[14px]">
                            {customer.financeContact && (
                              <div>{customer.financeContact}</div>
                            )}
                            {customer.financeContactEmail && (
                              <a
                                href={`mailto:${customer.financeContactEmail}`}
                                className="hover:text-[#606060] transition-colors"
                              >
                                {customer.financeContactEmail}
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {customer.primaryLanguage && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Language
                          </div>
                          <div className="text-[14px]">
                            {customer.primaryLanguage}
                          </div>
                        </motion.div>
                      )}
                      {customer.fiscalYearEnd && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
                          <div className="text-[12px] mb-2 text-[#606060]">
                            Fiscal Year End
                          </div>
                          <div className="text-[14px]">
                            {customer.fiscalYearEnd}
                          </div>
                        </motion.div>
                      )}
                      {customer.timezone &&
                        (() => {
                          const tz = formatTimezoneWithLocalTime(
                            customer.timezone,
                          );
                          return (
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10, scale: 0.95 },
                                visible: {
                                  opacity: 1,
                                  y: 0,
                                  scale: 1,
                                  transition: {
                                    duration: 0.3,
                                    ease: "easeOut",
                                  },
                                },
                              }}
                            >
                              <div className="text-[12px] mb-2 text-[#606060]">
                                Local Time
                              </div>
                              <div className="text-[14px] flex items-center gap-1.5">
                                <span>{tz.localTime}</span>
                                <span className="text-[#878787]">
                                  ({tz.relative})
                                </span>
                              </div>
                            </motion.div>
                          );
                        })()}
                      {/* Social Links */}
                      {(customer.linkedinUrl ||
                        customer.twitterUrl ||
                        customer.instagramUrl ||
                        customer.facebookUrl ||
                        customer.website) && (
                        <motion.div
                          className="col-span-2"
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          }}
                        >
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
                                <Icons.LinkedIn className="size-4" />
                              </a>
                            )}
                            {customer.twitterUrl && (
                              <a
                                href={customer.twitterUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground hover:opacity-70 transition-opacity"
                              >
                                <Icons.X className="size-4" />
                              </a>
                            )}
                            {customer.instagramUrl && (
                              <a
                                href={customer.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Icons.Instagram className="size-4" />
                              </a>
                            )}
                            {customer.facebookUrl && (
                              <a
                                href={customer.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Icons.Facebook className="size-4" />
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
                                <Icons.Globle className="size-5" />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {customer.enrichmentStatus === "failed" && (
                        <motion.div
                          className="col-span-2 text-[14px] text-[#606060]"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 },
                          }}
                        >
                          Failed to fetch company information.
                          {customer.website && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-[14px] ml-1"
                              onClick={handleStartEnrich}
                            >
                              Try again
                            </Button>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
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
                              variant="tag"
                              className="whitespace-nowrap flex-shrink-0"
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

          {/* Customer Portal Section */}
          <div className="border-t border-border pt-6 mt-6">
            {/* Portal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-medium">Customer Portal</h3>
                <p className="text-[12px] text-[#606060] mt-1">
                  Allow this customer to view their invoices
                </p>
              </div>
              <Switch
                checked={customer.portalEnabled ?? false}
                onCheckedChange={(checked) => {
                  togglePortalMutation.mutate({
                    customerId: customer.id,
                    enabled: checked,
                  });
                }}
                disabled={togglePortalMutation.isPending}
              />
            </div>

            {/* Portal URL - Only shown when enabled */}
            <AnimatePresence>
              {customer.portalEnabled && customer.portalId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mb-6 relative">
                    <CopyInput
                      value={`${window.location.origin}/p/${customer.portalId}`}
                      className="font-mono text-xs pr-14"
                    />
                    <div className="absolute right-10 top-2.5 border-r border-border pr-2 text-base">
                      <OpenURL
                        href={`${window.location.origin}/p/${customer.portalId}`}
                      >
                        <Icons.OpenInNew />
                      </OpenURL>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Statement Section */}
            <div className="pt-4">
              {/* Statement Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-medium">Statement</h3>
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
                                ? format(
                                    new TZDate(invoice.issueDate, "UTC"),
                                    "MMM d",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="text-[12px] whitespace-nowrap">
                              {invoice.dueDate
                                ? format(
                                    new TZDate(invoice.dueDate, "UTC"),
                                    "MMM d",
                                  )
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
