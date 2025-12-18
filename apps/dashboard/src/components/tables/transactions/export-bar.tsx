"use client";

import { ExportTransactionsModal } from "@/components/modals/export-transactions-modal";
import {
  type AccountingJobResult,
  useAccountingError,
} from "@/hooks/use-accounting-error";
import { useJobStatus } from "@/hooks/use-job-status";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import { useExportStore } from "@/store/export";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import NumberFlow from "@number-flow/react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

function XeroLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 40C31.0456 40 40 31.0456 40 20C40 8.95437 31.0456 0 20 0C8.95437 0 0 8.95437 0 20C0 31.0456 8.95437 40 20 40Z"
        fill="#13B5EA"
      />
      <path
        d="M9.61353 19.9424L13.0137 16.5339C13.1264 16.419 13.1893 16.2669 13.1893 16.1055C13.1893 15.7693 12.916 15.4963 12.5798 15.4963C12.416 15.4963 12.2625 15.5605 12.1467 15.6777L8.74963 19.0732L5.33735 15.6726C5.22205 15.5589 5.06927 15.4963 4.90727 15.4963C4.57147 15.4963 4.2981 15.7692 4.2981 16.1051C4.2981 16.2689 4.36351 16.4226 4.48091 16.5385L7.88058 19.9377L4.48267 23.342C4.36324 23.4596 4.2981 23.6136 4.2981 23.7782C4.2981 24.1143 4.57147 24.387 4.90727 24.387C5.06954 24.387 5.22246 24.3241 5.33735 24.2091L8.74435 20.8067L12.1384 24.1967C12.2588 24.3212 12.4141 24.3874 12.5798 24.3874C12.9157 24.3874 13.189 24.1143 13.189 23.7782C13.189 23.616 13.1261 23.4636 13.0118 23.3487L9.61353 19.9424Z"
        fill="white"
      />
      <path
        d="M29.8268 19.9414C29.8268 20.5519 30.3232 21.0484 30.9344 21.0484C31.5441 21.0484 32.0407 20.5519 32.0407 19.9414C32.0407 19.3308 31.5441 18.8343 30.9344 18.8343C30.3232 18.8343 29.8268 19.3308 29.8268 19.9414Z"
        fill="white"
      />
      <path
        d="M27.7271 19.9419C27.7271 18.1741 29.1652 16.7358 30.9332 16.7358C32.7003 16.7358 34.1388 18.1741 34.1388 19.9419C34.1388 21.7093 32.7003 23.1471 30.9332 23.1471C29.1652 23.1471 27.7271 21.7093 27.7271 19.9419ZM26.4659 19.9419C26.4659 22.4048 28.47 24.4085 30.9332 24.4085C33.3964 24.4085 35.4014 22.4048 35.4014 19.9419C35.4014 17.4788 33.3964 15.4745 30.9332 15.4745C28.47 15.4745 26.4659 17.4788 26.4659 19.9419Z"
        fill="white"
      />
      <path
        d="M26.1489 15.5509L25.9614 15.5503C25.3988 15.5503 24.8561 15.7278 24.4028 16.0771C24.3431 15.8038 24.0988 15.5981 23.8078 15.5981C23.4729 15.5981 23.2045 15.8665 23.2037 16.2021V23.726C23.2066 24.061 23.4799 24.3333 23.815 24.3333C24.1501 24.3333 24.4232 24.061 24.4241 23.7253V19.099C24.4244 17.5571 24.5654 16.9343 25.8862 16.7693C26.0083 16.7541 26.1411 16.7565 26.1416 16.7565C26.503 16.7441 26.7599 16.4957 26.7599 16.16C26.7599 15.8242 26.4857 15.5509 26.1489 15.5509Z"
        fill="white"
      />
      <path
        d="M14.4513 19.2065C14.4525 19.1725 14.4534 19.1553 14.4534 19.1553C14.807 17.7571 16.0733 16.7225 17.5814 16.7225C19.1076 16.7225 20.3855 17.7826 20.7211 19.2065H14.4513ZM21.9686 19.0915C21.7061 17.8485 21.0256 16.8276 19.9894 16.1719C18.4747 15.2103 16.4746 15.2635 15.0116 16.3039C13.8182 17.1529 13.1293 18.5417 13.1293 19.9723C13.1293 20.331 13.1725 20.6931 13.2625 21.0495C13.7132 22.8222 15.2371 24.1641 17.0539 24.3865C17.5931 24.4518 18.1179 24.4205 18.6613 24.2798C19.1282 24.1662 19.5801 23.9768 19.9964 23.71C20.4285 23.4322 20.7895 23.0659 21.1392 22.6275L21.1604 22.6038C21.403 22.3028 21.358 21.8749 21.0914 21.6706C20.8665 21.4982 20.4889 21.4283 20.1918 21.8088C20.128 21.8997 20.0567 21.9933 19.9783 22.0869C19.7421 22.348 19.449 22.6009 19.0978 22.797C18.6509 23.0358 18.1417 23.1722 17.6003 23.1753C15.8283 23.1556 14.88 21.9186 14.5428 21.0358C14.4839 20.8709 14.4384 20.6999 14.4068 20.5238L14.3984 20.4298H20.7573C21.629 20.4105 22.0982 19.7951 21.9686 19.0915Z"
        fill="white"
      />
    </svg>
  );
}

function QuickBooksLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 40C31.0456 40 40 31.0456 40 20C40 8.95437 31.0456 0 20 0C8.95437 0 0 8.95437 0 20C0 31.0456 8.95437 40 20 40Z"
        fill="#2CA01C"
      />
      <path
        d="M5.55585 20C5.55585 22.0628 6.3753 24.0411 7.83392 25.4998C9.29255 26.9584 11.2709 27.7778 13.3337 27.7778H14.4446V24.8888H13.3337C12.6884 24.8939 12.0484 24.7713 11.4507 24.5279C10.8531 24.2845 10.3095 23.9252 9.85132 23.4707C9.3932 23.0163 9.02957 22.4756 8.78142 21.8799C8.53328 21.2841 8.40552 20.6452 8.40552 19.9999C8.40552 19.3545 8.53328 18.7156 8.78142 18.1199C9.02957 17.5242 9.3932 16.9835 9.85132 16.529C10.3095 16.0745 10.8531 15.7152 11.4507 15.4718C12.0484 15.2284 12.6884 15.1058 13.3337 15.111H16.0002V30.2222C16.0005 30.9883 16.3049 31.723 16.8466 32.2647C17.3883 32.8064 18.1229 33.1109 18.889 33.1113V12.2222H13.3337C12.3122 12.2222 11.3008 12.4233 10.3571 12.8142C9.41345 13.205 8.55599 13.7779 7.83372 14.5002C7.11145 15.2224 6.53851 16.0798 6.14762 17.0235C5.75673 17.9672 5.55585 18.9786 5.55585 20ZM26.6668 12.2222H25.5559V15.1113H26.6668C27.9538 15.1258 29.1831 15.6473 30.0881 16.5625C30.993 17.4778 31.5006 18.7129 31.5006 20C31.5006 21.2871 30.993 22.5223 30.0881 23.4375C29.1831 24.3527 27.9538 24.8742 26.6668 24.8888H24.0002V9.77815C24.0003 9.39876 23.9256 9.02309 23.7804 8.67257C23.6353 8.32206 23.4225 8.00357 23.1542 7.73529C22.886 7.46701 22.5675 7.2542 22.217 7.10901C21.8665 6.96381 21.4909 6.88908 21.1115 6.88908V27.7781H26.6668C28.7296 27.7781 30.7079 26.9587 32.1665 25.5001C33.6252 24.0415 34.4446 22.0631 34.4446 20.0003C34.4446 17.9375 33.6252 15.9592 32.1665 14.5006C30.7079 13.042 28.7296 12.2222 26.6668 12.2222Z"
        fill="white"
      />
    </svg>
  );
}

function FortnoxLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1550 1550"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#003824"
        d="m774.4 302.8h243.3c17.6 0 27.1 9.5 27.1 27.1v129.8c0 17.5-9.4 26.9-27.1 26.9h-243.3c-56.7 0-94.5 37.9-94.5 94.6v177h337.8c17.6 0 27.1 9.5 27.1 27v129.8c0 17.6-9.4 27.1-27.1 27.1h-337.8v252.6c0 17.6-9.5 27.1-27.1 27.1h-135.1c-17.6 0-27.1-9.4-27.1-27.1v-608.1c0-168.9 114.9-283.9 283.8-283.9"
      />
      <path
        fill="#007533"
        d="m774.8 1549.9c-148.3 0-294.9-42.5-421.6-124.7-157-101.7-271.7-256.7-323.1-436.3-51-177.8-36.9-367.9 39.6-535.2 12.3-26.8 44-38.6 70.8-26.3 26.7 12.2 38.6 43.9 26.2 70.7-65.9 144.2-78 308.2-34.1 461.5 44.3 154.8 143.3 288.5 278.6 376.2 160.5 104.1 358.5 134.3 543.2 82.8 28.4-7.8 57.8 8.8 65.7 37.1 7.8 28.4-8.8 57.8-37.1 65.6-68.5 19.2-138.5 28.5-208.3 28.5z"
      />
      <path
        fill="#ffc200"
        d="m1162.9 1436.8c-17.6 0-34.9-8.8-45-24.8-15.8-24.8-8.5-57.8 16.3-73.6 81.1-51.7 148.9-118.8 201.3-199.7 200.5-309.2 112.1-723.8-197-924.3-10.1-6.6-21.2-13.2-34.7-20.9-25.6-14.5-34.7-47-20.1-72.7 14.5-25.6 47-34.7 72.7-20.1 15.5 8.7 28.3 16.4 40.2 24.1 358.5 232.5 460.9 713.4 228.4 1071.9-60.8 93.8-139.4 171.7-233.5 231.6-8.9 5.7-18.8 8.4-28.6 8.4z"
      />
      <path
        fill="#00db33"
        d="m234 350.8c-12.5 0-25.2-4.3-35.2-13.2-22.2-19.5-24.3-53.2-4.8-75.3 186.3-211.8 473.6-305.2 749.4-243.7 28.8 6.4 46.9 34.9 40.5 63.7-6.4 28.7-34.9 46.8-63.7 40.4-237.9-53-485.5 27.6-646.3 210-10.5 11.9-25.2 18.1-39.9 18.1z"
      />
    </svg>
  );
}

const PROVIDER_ICONS: Record<string, React.FC<{ className?: string }>> = {
  xero: XeroLogo,
  quickbooks: QuickBooksLogo,
  fortnox: FortnoxLogo,
};

const EXPORT_PREFERENCE_KEY = "midday-export-preference";

type ExportPreference = "accounting" | "file";

export function ExportBar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { showExportResult, showJobFailure, showMutationError } =
    useAccountingError();
  const { tab } = useTransactionTab();
  const {
    exportData,
    setExportData,
    setIsExporting,
    setExportingTransactionIds,
  } = useExportStore();
  const { rowSelection, setRowSelection, canDelete } = useTransactionsStore();
  const [isOpen, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportingCount, setExportingCount] = useState<number | null>(null);
  const [exportPreference, setExportPreference] =
    useState<ExportPreference>("accounting");
  const hasShownErrorRef = useRef(false);

  // Load export preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(EXPORT_PREFERENCE_KEY);
    if (stored === "accounting" || stored === "file") {
      setExportPreference(stored);
    }
  }, []);

  const isReviewTab = tab === "review";
  const selectedCount = Object.keys(rowSelection).length;
  const hasManualSelection = selectedCount > 0;

  // Fetch review count for displaying when on review tab with no selection
  const { data: reviewCount } = useQuery(
    trpc.transactions.getReviewCount.queryOptions(undefined, {
      enabled: isReviewTab && !hasManualSelection,
    }),
  );

  // Fetch connected accounting providers
  const { data: connectedApps } = useQuery(trpc.apps.getApps.queryOptions());

  // Fetch review transaction IDs when on review tab without selection (for accounting export)
  const { data: reviewData } = useInfiniteQuery(
    trpc.transactions.get.infiniteQueryOptions(
      {
        attachments: "include",
        excludeSynced: true,
        pageSize: 10000,
      },
      {
        getNextPageParam: ({ meta }) => meta?.cursor,
      },
    ),
  );

  // Find the first connected accounting provider
  const connectedProvider = useMemo(() => {
    const accountingProviderIds = ["xero", "quickbooks", "fortnox"];
    const providers =
      connectedApps?.filter((app) =>
        accountingProviderIds.includes(app.app_id),
      ) ?? [];
    return providers[0];
  }, [connectedApps]);

  // Delete mutation for bulk delete
  const deleteTransactionsMutation = useMutation(
    trpc.transactions.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getReviewCount.queryKey(),
        });
        setRowSelection({});
      },
    }),
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
              PROVIDER_NAMES[connectedProvider?.app_id ?? ""] ??
              connectedProvider?.app_id,
          });
          setRowSelection(() => ({}));
        }
      },
      onError: () => {
        setIsExporting(false);
        setExportingTransactionIds([]);
        setExportingCount(null);
        showMutationError(
          PROVIDER_NAMES[connectedProvider?.app_id ?? ""] ??
            connectedProvider?.app_id ??
            "accounting software",
        );
      },
    }),
  );

  // Get IDs for export - either selected or all review transactions
  const transactionIdsForExport = useMemo(() => {
    if (hasManualSelection) {
      return Object.keys(rowSelection);
    }
    // Get all IDs from review data
    return (
      reviewData?.pages.flatMap((page) => page.data.map((tx) => tx.id)) ?? []
    );
  }, [hasManualSelection, rowSelection, reviewData]);

  // Track job status for accounting export
  const { status: jobStatus, result: jobResult } = useJobStatus({
    jobId: exportData?.runId,
    enabled: !!exportData?.runId && exportData?.exportType === "accounting",
  });

  // Handle job completion/failure
  useEffect(() => {
    const providerName = exportData?.providerName ?? "accounting software";

    if (jobStatus === "completed") {
      setIsExporting(false);

      const result = jobResult as AccountingJobResult | null;

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
    exportData?.providerName,
    showExportResult,
    showJobFailure,
    setIsExporting,
    setExportData,
    setExportingTransactionIds,
    queryClient,
    trpc.transactions.get,
    trpc.transactions.getReviewCount,
  ]);

  // Determine what count to show - use exportingCount during export to prevent flickering
  const displayCount =
    exportingCount !== null
      ? exportingCount
      : hasManualSelection
        ? selectedCount
        : (reviewCount ?? 0);

  // Show bar when:
  // 1. On review tab (even with no selection) - show ready to export count
  // 2. When rows are manually selected (any tab)
  const shouldShow =
    (isReviewTab && (displayCount > 0 || hasManualSelection)) ||
    hasManualSelection;

  useEffect(() => {
    setOpen(shouldShow);
    if (!shouldShow) {
      setIsModalOpen(false);
    }
  }, [shouldShow]);

  const ProviderIcon = connectedProvider
    ? PROVIDER_ICONS[connectedProvider.app_id]
    : null;

  const transactionIds = Object.keys(rowSelection);

  // Select accounting export (just sets preference, doesn't trigger export)
  const selectAccountingExport = () => {
    localStorage.setItem(EXPORT_PREFERENCE_KEY, "accounting");
    setExportPreference("accounting");
  };

  // Select file export (just sets preference, doesn't trigger export)
  const selectFileExport = () => {
    localStorage.setItem(EXPORT_PREFERENCE_KEY, "file");
    setExportPreference("file");
  };

  // Execute accounting export
  const executeAccountingExport = () => {
    if (!connectedProvider) return;
    if (transactionIdsForExport.length === 0) return;

    // Save the count and IDs at export time to prevent flickering
    setExportingCount(transactionIdsForExport.length);
    setExportingTransactionIds(transactionIdsForExport);
    setIsExporting(true);
    accountingExportMutation.mutate({
      transactionIds: transactionIdsForExport,
      providerId: connectedProvider.app_id as "xero" | "quickbooks" | "fortnox",
    });
  };

  // Execute file export (opens modal)
  const executeFileExport = () => {
    setIsModalOpen(true);
  };

  // Handle primary export button click based on preference
  const handlePrimaryExport = () => {
    // If no accounting provider connected, always use file export
    if (!connectedProvider) {
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
  const isExportingAccounting =
    accountingExportMutation.isPending ||
    jobStatus === "active" ||
    jobStatus === "waiting" ||
    (exportData?.runId &&
      exportData?.exportType === "accounting" &&
      jobStatus !== "completed" &&
      jobStatus !== "failed");

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="h-12 fixed left-[50%] bottom-2 w-[520px] -ml-[260px] z-50"
          animate={{ y: isOpen ? 0 : 100 }}
          initial={{ y: 100 }}
        >
          <div className="mx-2 md:mx-0 backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C]">
            <span className="text-sm text-[#878787]">
              <NumberFlow value={displayCount} />{" "}
              {exportingCount !== null
                ? "exporting"
                : hasManualSelection
                  ? "selected"
                  : "transactions ready to export"}
            </span>

            <div className="flex items-center space-x-2">
              {hasManualSelection && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRowSelection({})}
                  >
                    Deselect
                  </Button>

                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Icons.Delete size={18} />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your transactions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteTransactionsMutation.mutate(transactionIds);
                            }}
                          >
                            {deleteTransactionsMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <div className="h-4 w-[1px] bg-border mx-1" />
                </>
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
                    {connectedProvider &&
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
                      {connectedProvider && ProviderIcon ? (
                        <DropdownMenuItem onClick={selectAccountingExport}>
                          <ProviderIcon className="size-4 mr-2" />
                          Export to {PROVIDER_NAMES[connectedProvider.app_id]}
                        </DropdownMenuItem>
                      ) : (
                        // Show connect options when no provider is connected
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
                        })
                      )}
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

      <ExportTransactionsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
