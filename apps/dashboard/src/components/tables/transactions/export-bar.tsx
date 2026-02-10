"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExportTransactionsModal } from "@/components/modals/export-transactions-modal";
import { Portal } from "@/components/portal";
import {
  type AccountingJobResult,
  useAccountingError,
} from "@/hooks/use-accounting-error";
import { useJobStatus } from "@/hooks/use-job-status";
import { useSuccessSound } from "@/hooks/use-success-sound";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import { useExportStore } from "@/store/export";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";

const PROVIDER_NAMES: Record<string, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks",
  fortnox: "Fortnox",
};

const ACCOUNTING_PROVIDERS = [
  { id: "xero", name: "Xero" },
  { id: "quickbooks", name: "QuickBooks" },
  { id: "fortnox", name: "Fortnox" },
] as const;

const PROVIDER_ICONS: Record<string, React.FC<{ className?: string }>> = {
  xero: Icons.Xero,
  quickbooks: Icons.QuickBooks,
  fortnox: Icons.Fortnox,
};

type ExportPreference = "accounting" | "file";

export function ExportBar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { showExportResult, showJobFailure, showMutationError } =
    useAccountingError();
  const { play: playSuccessSound } = useSuccessSound();
  const { tab } = useTransactionTab();
  const {
    exportData,
    setExportData,
    setIsExporting,
    setExportingTransactionIds,
  } = useExportStore();
  const { rowSelectionByTab, setRowSelection } = useTransactionsStore();
  // ExportBar is only shown on review tab, so use review tab selection
  const rowSelection = rowSelectionByTab.review;
  const [isOpen, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportingCount, setExportingCount] = useState<number | null>(null);
  const [exportPreference, setExportPreference] =
    useState<ExportPreference>("file");
  const hasShownErrorRef = useRef(false);

  const isReviewTab = tab === "review";
  const selectedCount = Object.keys(rowSelection).length;
  const hasManualSelection = selectedCount > 0;

  // Fetch connected accounting providers
  const { data: connectedApps } = useQuery(trpc.apps.get.queryOptions());

  // Find all connected accounting providers
  const connectedProviders = useMemo(() => {
    const accountingProviderIds = ["xero", "quickbooks", "fortnox"];
    return (
      connectedApps?.filter((app) =>
        accountingProviderIds.includes(app.app_id),
      ) ?? []
    );
  }, [connectedApps]);

  // Track which provider is selected for the primary export button
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );

  // Set default selected provider when connected providers change
  useEffect(() => {
    if (connectedProviders.length > 0 && !selectedProviderId) {
      setSelectedProviderId(connectedProviders[0]!.app_id);
      setExportPreference("accounting");
    } else if (connectedProviders.length === 0) {
      setSelectedProviderId(null);
      setExportPreference("file");
    }
  }, [connectedProviders, selectedProviderId]);

  // The currently selected provider for the primary button
  const activeProvider = useMemo(
    () => connectedProviders.find((p) => p.app_id === selectedProviderId),
    [connectedProviders, selectedProviderId],
  );

  // Accounting export mutation
  const accountingExportMutation = useMutation(
    trpc.accounting.export.mutationOptions({
      onSuccess: (data) => {
        if (data?.id) {
          hasShownErrorRef.current = false; // Reset error flag for new export
          setExportData({
            runId: data.id,
            exportType: "accounting",
            providerName:
              PROVIDER_NAMES[activeProvider?.app_id ?? ""] ??
              activeProvider?.app_id,
          });
          setRowSelection("review", {});
        }
      },
      onError: () => {
        setIsExporting(false);
        setExportingTransactionIds([]);
        setExportingCount(null);
        showMutationError(
          PROVIDER_NAMES[activeProvider?.app_id ?? ""] ??
            activeProvider?.app_id ??
            "accounting software",
        );
      },
    }),
  );

  // Get IDs for export - only manually selected transactions
  const transactionIdsForExport = useMemo(() => {
    return Object.keys(rowSelection);
  }, [rowSelection]);

  // Track job status for accounting export
  const {
    status: jobStatus,
    result: jobResult,
    queryError,
  } = useJobStatus({
    jobId: exportData?.runId,
    enabled: !!exportData?.runId && exportData?.exportType === "accounting",
  });

  // Handle job completion/failure/query errors
  useEffect(() => {
    const providerName = exportData?.providerName ?? "accounting software";

    // Handle query errors (network error, job not found, access denied, etc.)
    if (queryError && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      setIsExporting(false);

      showJobFailure(providerName);

      setExportData(undefined);
      setExportingCount(null);
      setExportingTransactionIds([]);
      return;
    }

    if (jobStatus === "completed") {
      setIsExporting(false);

      const result = jobResult as AccountingJobResult | null;

      // Play success sound if no failures
      if (result && result.failedCount === 0) {
        playSuccessSound();
      }

      if (!hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        showExportResult(result, providerName);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.infiniteQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.getReviewCount.queryKey(),
      });

      // Delay clearing exportData and exportingCount to show completion
      setTimeout(() => {
        setExportData(undefined);
        setExportingCount(null);
        setExportingTransactionIds([]);
      }, 1000);
    } else if (jobStatus === "failed" && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      setIsExporting(false);

      showJobFailure(providerName);

      setExportData(undefined);
      setExportingCount(null);
      setExportingTransactionIds([]);
    }
  }, [
    jobStatus,
    jobResult,
    queryError,
    exportData?.providerName,
    showExportResult,
    showJobFailure,
    playSuccessSound,
    setIsExporting,
    setExportData,
    setExportingTransactionIds,
    queryClient,
    trpc.transactions.get,
    trpc.transactions.getReviewCount,
  ]);

  // Determine what count to show - use exportingCount during export to prevent flickering
  // Show selected count (user must manually select transactions to export)
  const displayCount = exportingCount !== null ? exportingCount : selectedCount;

  // Show bar on review tab - user selects transactions to export
  // Bulk edit bar handles selection on all/other tabs
  const shouldShow = isReviewTab;

  useEffect(() => {
    setOpen(shouldShow);
    if (!shouldShow) {
      setIsModalOpen(false);
    }
  }, [shouldShow]);

  const ProviderIcon = activeProvider
    ? PROVIDER_ICONS[activeProvider.app_id]
    : null;

  // Select accounting export for a specific provider
  const selectAccountingExport = (providerId: string) => {
    setSelectedProviderId(providerId);
    setExportPreference("accounting");
  };

  // Select file export (just sets preference, doesn't trigger export)
  const selectFileExport = () => {
    setExportPreference("file");
  };

  // Execute accounting export
  const executeAccountingExport = () => {
    if (!activeProvider) return;
    if (transactionIdsForExport.length === 0) return;

    // Save the count and IDs at export time to prevent flickering
    setExportingCount(transactionIdsForExport.length);
    setExportingTransactionIds(transactionIdsForExport);
    setIsExporting(true);
    accountingExportMutation.mutate({
      transactionIds: transactionIdsForExport,
      providerId: activeProvider.app_id as "xero" | "quickbooks" | "fortnox",
    });
  };

  // Execute file export (opens modal)
  const executeFileExport = () => {
    setIsModalOpen(true);
  };

  // Handle primary export button click based on preference
  const handlePrimaryExport = () => {
    // If no accounting provider connected, always use file export
    if (!activeProvider) {
      executeFileExport();
      return;
    }

    // Use the saved preference, defaulting to accounting if provider is connected
    if (exportPreference === "file") {
      executeFileExport();
    } else {
      executeAccountingExport();
    }
  };

  // Show loading state when:
  // 1. Mutation is in flight
  // 2. Job is active/waiting
  // 3. We have an accounting export runId but job status hasn't updated yet
  // Note: Don't show loading if there's a query error (network failure, job not found, etc.)
  const isExportingAccounting =
    accountingExportMutation.isPending ||
    jobStatus === "active" ||
    jobStatus === "waiting" ||
    (exportData?.runId &&
      exportData?.exportType === "accounting" &&
      jobStatus !== "completed" &&
      jobStatus !== "failed" &&
      !queryError);

  return (
    <>
      <Portal>
        <AnimatePresence>
          <motion.div
            className="h-12 fixed left-[50%] bottom-6 w-[400px] -ml-[200px] z-50"
            animate={{ y: isOpen ? 0 : 100 }}
            initial={{ y: 100 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Blur layer fades in separately to avoid backdrop-filter animation issues */}
            <motion.div
              className="absolute inset-0 mx-2 md:mx-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            />
            <div className="relative mx-2 md:mx-0 h-12 justify-between items-center flex pl-4 pr-2">
              <span className="text-sm">
                {exportingCount !== null
                  ? `${displayCount} exporting`
                  : displayCount > 0
                    ? `${displayCount} selected`
                    : "Select transactions to export"}
              </span>

              <div className="flex items-center space-x-2">
                {hasManualSelection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setRowSelection("review", {})}
                  >
                    Deselect
                  </Button>
                )}

                {isExportingAccounting ? (
                  <Button disabled className="gap-2">
                    <Spinner className="size-4" />
                    <span>Exporting...</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-[1px]">
                    <Button
                      onClick={handlePrimaryExport}
                      disabled={displayCount === 0}
                      className="rounded-r-none gap-2"
                    >
                      {/* Show provider icon only for accounting export */}
                      {activeProvider &&
                        exportPreference === "accounting" &&
                        ProviderIcon && <ProviderIcon className="size-4" />}
                      <span>Export</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          disabled={displayCount === 0}
                          className="rounded-l-none px-2"
                        >
                          <Icons.ChevronDown className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={10}>
                        {/* Show all connected providers */}
                        {connectedProviders.map((provider) => {
                          const Icon = PROVIDER_ICONS[provider.app_id];
                          return (
                            <DropdownMenuItem
                              key={provider.app_id}
                              onClick={() =>
                                selectAccountingExport(provider.app_id)
                              }
                            >
                              {Icon && <Icon className="size-4 mr-2" />}
                              Export to {PROVIDER_NAMES[provider.app_id]}
                            </DropdownMenuItem>
                          );
                        })}
                        {/* Show connect options for unconnected providers */}
                        {connectedProviders.length === 0 &&
                          ACCOUNTING_PROVIDERS.map((provider) => {
                            const Icon = PROVIDER_ICONS[provider.id];
                            return (
                              <DropdownMenuItem key={provider.id} asChild>
                                <Link href={`/apps?app=${provider.id}`}>
                                  {Icon && <Icon className="size-4 mr-2" />}
                                  Connect {provider.name}
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        <DropdownMenuItem onClick={selectFileExport}>
                          <Icons.FolderZip className="size-4 mr-2" />
                          Export to file
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </Portal>

      <ExportTransactionsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
