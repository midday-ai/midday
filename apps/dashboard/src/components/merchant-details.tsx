"use client";

import { CopyInput } from "@/components/copy-input";
import { OpenURL } from "@/components/open-url";
import { useMerchantParams } from "@/hooks/use-merchant-params";
import { useDealParams } from "@/hooks/use-deal-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getWebsiteLogo } from "@/utils/logos";
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
import { MerchantDetailsSkeleton } from "./merchant-details.loading";
import { FormatAmount } from "./format-amount";
import { DealStatus } from "./deal-status";

// Format timezone with local time and relative difference
function formatTimezoneWithLocalTime(timezone: string): {
  localTime: string;
  relative: string;
} {
  try {
    const now = new Date();

    // Get the local time in the merchant's timezone using user's locale
    const merchantTime = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(now);

    // Calculate hour difference
    const merchantDate = new Date(
      now.toLocaleString("en-US", { timeZone: timezone }),
    );
    const userDate = new Date(now.toLocaleString("en-US"));
    const diffMs = merchantDate.getTime() - userDate.getTime();
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

    return { localTime: merchantTime, relative };
  } catch {
    return { localTime: "", relative: "" };
  }
}

export function MerchantDetails() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const { merchantId, setParams } = useMerchantParams();
  const { setParams: setDealParams } = useDealParams();
  const { toast } = useToast();
  const dropdownContainerRef = useRef<HTMLDivElement>(null!);

  // Track enrichment animation - use a key that changes when enrichment completes
  const [enrichmentAnimationKey, setEnrichmentAnimationKey] = useState(0);
  const prevEnrichmentStatusRef = useRef<string | null>(null);

  const isOpen = merchantId !== null;

  // Toggle portal mutation
  const togglePortalMutation = useMutation(
    trpc.merchants.togglePortal.mutationOptions({
      onSuccess: () => {
        // Invalidate merchant query to refresh portal data
        queryClient.invalidateQueries({
          queryKey: trpc.merchants.getById.queryKey({ id: merchantId! }),
        });
      },
      onError: () => {
        toast({
          title: "Failed to update merchant portal",
          description: "Please try again.",
          duration: 2500,
        });
      },
    }),
  );

  const {
    data: merchant,
    isLoading: isLoadingMerchant,
    refetch,
  } = useQuery({
    ...trpc.merchants.getById.queryOptions({ id: merchantId! }),
    enabled: isOpen,
    placeholderData: keepPreviousData,
    staleTime: 0, // Always refetch when component mounts
  });

  // Mutation for re-enriching merchant
  const enrichMutation = useMutation(
    trpc.merchants.enrich.mutationOptions({
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.merchants.getById.queryKey({ id: merchantId! }),
        });

        // Optimistically update to pending status
        queryClient.setQueryData(
          trpc.merchants.getById.queryKey({ id: merchantId! }),
          (old: typeof merchant) =>
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
    ...trpc.merchants.cancelEnrichment.mutationOptions(),
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation for clearing enrichment data
  const clearEnrichmentMutation = useMutation({
    ...trpc.merchants.clearEnrichment.mutationOptions(),
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
    if (merchantId) {
      enrichMutation.mutate({ id: merchantId });
    }
  };

  const handleCancelEnrich = () => {
    if (merchantId) {
      cancelEnrichmentMutation.mutate({ id: merchantId });
    }
  };

  const handleClearEnrichment = () => {
    if (merchantId) {
      clearEnrichmentMutation.mutate({ id: merchantId });
    }
  };

  const isEnriching =
    merchant?.enrichmentStatus === "pending" ||
    merchant?.enrichmentStatus === "processing" ||
    enrichMutation.isPending;

  // Track enrichment status changes to trigger animation only when transitioning from loading to complete
  useEffect(() => {
    const prevStatus = prevEnrichmentStatusRef.current;
    const currentStatus = merchant?.enrichmentStatus;

    // Increment key to trigger animation when transitioning from pending/processing to completed
    if (
      (prevStatus === "pending" || prevStatus === "processing") &&
      currentStatus === "completed"
    ) {
      setEnrichmentAnimationKey((k) => k + 1);
    }

    prevEnrichmentStatusRef.current = currentStatus ?? null;
  }, [merchant?.enrichmentStatus]);

  // Reset animation state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      prevEnrichmentStatusRef.current = null;
    }
  }, [isOpen]);

  // Subscribe to realtime updates for this merchant
  useRealtime({
    channelName: `merchant-${merchantId}`,
    event: "UPDATE",
    table: "merchants",
    filter: merchantId ? `id=eq.${merchantId}` : undefined,
    onEvent: (payload) => {
      // Refetch merchant data when enrichment status changes
      if (payload.new && "enrichment_status" in payload.new) {
        refetch();
      }
    },
  });

  const infiniteQueryOptions = trpc.deal.get.infiniteQueryOptions(
    {
      merchants: merchantId ? [merchantId] : undefined,
      pageSize: 5,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const {
    data: dealsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...infiniteQueryOptions,
    enabled: isOpen,
  });

  const deals = useMemo(() => {
    return dealsData?.pages.flatMap((page) => page.data) ?? [];
  }, [dealsData]);

  // Get deal summary from server
  const { data: summary } = useQuery({
    ...trpc.merchants.getDealSummary.queryOptions({ id: merchantId! }),
    enabled: isOpen && Boolean(merchantId),
  });

  const handleDownloadDeal = (dealId: string) => {
    if (!user?.fileKey) {
      console.error("File key not available");
      return;
    }
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/files/download/deal`,
    );
    url.searchParams.set("id", dealId);
    url.searchParams.set("fk", user.fileKey);
    downloadFile(url.toString(), "deal.pdf");
  };

  if (isLoadingMerchant) {
    return <MerchantDetailsSkeleton />;
  }

  if (!merchant) {
    return null;
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleEdit = () => {
    setParams({ merchantId: merchantId!, details: null });
  };

  // Check if merchant has any enrichment data
  const hasEnrichmentData =
    merchant?.description ||
    merchant?.industry ||
    merchant?.companyType ||
    merchant?.employeeCount ||
    merchant?.fundingStage;

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
            ) : merchant.website ? (
              <img
                src={getWebsiteLogo(merchant.website)}
                alt={`${merchant.name} logo`}
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
                merchant.website && "hidden",
              )}
            >
              {merchant.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-serif truncate">{merchant.name}</h2>
          </div>

          {/* Actions menu */}
          {merchant.website && (
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
        {(merchant.description ||
          merchant.industry ||
          merchant.companyType ||
          merchant.employeeCount ||
          merchant.fundingStage ||
          isEnriching) && (
          <div className="px-6 pb-4 border-b border-border">
            {/* Description */}
            {isEnriching ? (
              <div className="space-y-1.5">
                <Skeleton className="h-[13px] w-full" />
                <Skeleton className="h-[13px] w-4/5" />
              </div>
            ) : merchant.description ? (
              <p className="text-[13px] text-[#606060] line-clamp-2">
                {merchant.description}
              </p>
            ) : null}

            {/* Badges */}
            {isEnriching ? (
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ) : merchant.industry ||
              merchant.companyType ||
              merchant.employeeCount ||
              merchant.fundingStage ? (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {merchant.industry && (
                  <Badge variant="tag">{merchant.industry}</Badge>
                )}
                {merchant.companyType && (
                  <Badge variant="tag">{merchant.companyType}</Badge>
                )}
                {merchant.employeeCount && (
                  <Badge variant="tag">
                    {merchant.employeeCount} employees
                  </Badge>
                )}
                {merchant.fundingStage && (
                  <Badge variant="tag">{merchant.fundingStage}</Badge>
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
                  {merchant.contact && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Contact person
                      </div>
                      <div className="text-[14px]">{merchant.contact}</div>
                    </div>
                  )}
                  {merchant.email && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Email
                      </div>
                      <div className="text-[14px]">{merchant.email}</div>
                    </div>
                  )}
                  {merchant.billingEmail && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Billing Email
                      </div>
                      <div className="text-[14px]">{merchant.billingEmail}</div>
                    </div>
                  )}
                  {merchant.phone && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Phone
                      </div>
                      <div className="text-[14px]">{merchant.phone}</div>
                    </div>
                  )}
                  {merchant.website && (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Website
                      </div>
                      <div className="text-[14px]">{merchant.website}</div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Company Profile Section - Only show if we have enrichment data, it's processing, or failed */}
            {(hasEnrichmentData ||
              isEnriching ||
              merchant.enrichmentStatus === "completed" ||
              merchant.enrichmentStatus === "failed") && (
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
                      {merchant.industry && (
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
                          <div className="text-[14px]">{merchant.industry}</div>
                        </motion.div>
                      )}
                      {merchant.companyType && (
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
                            {merchant.companyType}
                          </div>
                        </motion.div>
                      )}
                      {merchant.employeeCount && (
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
                            {merchant.employeeCount}
                          </div>
                        </motion.div>
                      )}
                      {merchant.foundedYear && (
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
                            {merchant.foundedYear}
                          </div>
                        </motion.div>
                      )}
                      {merchant.estimatedRevenue && (
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
                            {merchant.estimatedRevenue}
                          </div>
                        </motion.div>
                      )}
                      {(merchant.fundingStage || merchant.totalFunding) && (
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
                            {merchant.fundingStage}
                            {merchant.totalFunding &&
                              ` (${merchant.totalFunding})`}
                          </div>
                        </motion.div>
                      )}
                      {merchant.headquartersLocation && (
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
                            {merchant.headquartersLocation}
                          </div>
                        </motion.div>
                      )}
                      {merchant.ceoName && (
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
                          <div className="text-[14px]">{merchant.ceoName}</div>
                        </motion.div>
                      )}
                      {(merchant.financeContact ||
                        merchant.financeContactEmail) && (
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
                            {merchant.financeContact && (
                              <div>{merchant.financeContact}</div>
                            )}
                            {merchant.financeContactEmail && (
                              <a
                                href={`mailto:${merchant.financeContactEmail}`}
                                className="hover:text-[#606060] transition-colors"
                              >
                                {merchant.financeContactEmail}
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {merchant.primaryLanguage && (
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
                            {merchant.primaryLanguage}
                          </div>
                        </motion.div>
                      )}
                      {merchant.fiscalYearEnd && (
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
                            {merchant.fiscalYearEnd}
                          </div>
                        </motion.div>
                      )}
                      {merchant.timezone &&
                        (() => {
                          const tz = formatTimezoneWithLocalTime(
                            merchant.timezone,
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
                      {(merchant.linkedinUrl ||
                        merchant.twitterUrl ||
                        merchant.instagramUrl ||
                        merchant.facebookUrl ||
                        merchant.website) && (
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
                            {merchant.linkedinUrl && (
                              <a
                                href={merchant.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Icons.LinkedIn className="size-4" />
                              </a>
                            )}
                            {merchant.twitterUrl && (
                              <a
                                href={merchant.twitterUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground hover:opacity-70 transition-opacity"
                              >
                                <Icons.X className="size-4" />
                              </a>
                            )}
                            {merchant.instagramUrl && (
                              <a
                                href={merchant.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Icons.Instagram className="size-4" />
                              </a>
                            )}
                            {merchant.facebookUrl && (
                              <a
                                href={merchant.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Icons.Facebook className="size-4" />
                              </a>
                            )}
                            {merchant.website && (
                              <a
                                href={
                                  merchant.website.startsWith("http")
                                    ? merchant.website
                                    : `https://${merchant.website}`
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

                      {merchant.enrichmentStatus === "failed" && (
                        <motion.div
                          className="col-span-2 text-[14px] text-[#606060]"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 },
                          }}
                        >
                          Failed to fetch company information.
                          {merchant.website && (
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
                  {merchant.addressLine1 ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Address
                      </div>
                      <div className="text-[14px]">
                        {merchant.addressLine1}
                        {merchant.addressLine2 && `, ${merchant.addressLine2}`}
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
                  {merchant.city ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        City
                      </div>
                      <div className="text-[14px]">{merchant.city}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        City
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {merchant.state ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        State
                      </div>
                      <div className="text-[14px]">{merchant.state}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        State
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {merchant.zip ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        ZIP Code
                      </div>
                      <div className="text-[14px]">{merchant.zip}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        ZIP Code
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {merchant.country ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Country
                      </div>
                      <div className="text-[14px]">{merchant.country}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Country
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {merchant.vatNumber ? (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        VAT Number
                      </div>
                      <div className="text-[14px]">{merchant.vatNumber}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] mb-2 text-[#606060]">
                        VAT Number
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {merchant.note ? (
                    <div className="col-span-2">
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Note
                      </div>
                      <div className="text-[14px]">{merchant.note}</div>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Note
                      </div>
                      <div className="text-[14px] text-[#606060]">-</div>
                    </div>
                  )}
                  {merchant.tags && merchant.tags.length > 0 ? (
                    <div className="col-span-2">
                      <div className="text-[12px] mb-2 text-[#606060]">
                        Tags
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {merchant.tags.map((tag) => (
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

          {/* Merchant Portal Section */}
          <div className="border-t border-border pt-6 mt-6">
            {/* Portal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-medium">Merchant Portal</h3>
                <p className="text-[12px] text-[#606060] mt-1">
                  Allow this merchant to view their deals
                </p>
              </div>
              <Switch
                checked={merchant.portalEnabled ?? false}
                onCheckedChange={(checked) => {
                  togglePortalMutation.mutate({
                    merchantId: merchant.id,
                    enabled: checked,
                  });
                }}
                disabled={togglePortalMutation.isPending}
              />
            </div>

            {/* Portal URL - Only shown when enabled */}
            <AnimatePresence>
              {merchant.portalEnabled && merchant.portalId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mb-6 relative">
                    <CopyInput
                      value={`${window.location.origin}/p/${merchant.portalId}`}
                      className="font-mono text-xs pr-14"
                    />
                    <div className="absolute right-10 top-2.5 border-r border-border pr-2 text-base">
                      <OpenURL
                        href={`${window.location.origin}/p/${merchant.portalId}`}
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
                  {merchant.name}
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
                      Deals
                    </div>
                    <div className="text-[18px] font-medium">
                      {summary?.dealCount ?? 0}
                    </div>
                  </div>
                </div>

                {/* Deal Table */}
                {deals.length > 0 ? (
                  <div ref={dropdownContainerRef}>
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-[12px] font-medium text-[#606060]">
                            Deal
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
                        {deals.map((deal) => (
                          <TableRow
                            key={deal.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              // Close merchant details sheet
                              setParams({ merchantId: null, details: null });
                              // Open deal details
                              setDealParams({
                                dealId: deal.id,
                                type: "details",
                              });
                            }}
                          >
                            <TableCell className="text-[12px] whitespace-nowrap min-w-[100px]">
                              {deal.dealNumber || "Draft"}
                            </TableCell>
                            <TableCell className="text-[12px] whitespace-nowrap">
                              {deal.issueDate
                                ? format(
                                    new TZDate(deal.issueDate, "UTC"),
                                    "MMM d",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="text-[12px] whitespace-nowrap">
                              {deal.dueDate
                                ? format(
                                    new TZDate(deal.dueDate, "UTC"),
                                    "MMM d",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="text-[12px] whitespace-nowrap">
                              {deal.amount != null && deal.currency ? (
                                <FormatAmount
                                  amount={deal.amount}
                                  currency={deal.currency}
                                />
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-[12px] whitespace-nowrap">
                              <DealStatus
                                status={deal.status as any}
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
                                  {deal.status !== "draft" ? (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadDeal(deal.id);
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
                        <h2 className="font-medium text-sm">No deals</h2>
                        <p className="text-[#606060] text-xs">
                          This merchant doesn't have any deals yet. <br />
                          Create your first deal for them.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          // Close merchant details sheet
                          setParams({ merchantId: null, details: null });
                          // Open deal creation with merchant pre-selected
                          setDealParams({
                            type: "create",
                            selectedMerchantId: merchantId!,
                          });
                        }}
                      >
                        Create Deal
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
