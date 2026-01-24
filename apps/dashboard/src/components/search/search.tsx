"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useFileUrl } from "@/hooks/use-file-url";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useSearchStore } from "@/store/search";
import { useTRPC } from "@/trpc/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { formatDate } from "@midday/utils/format";
import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceValue } from "usehooks-ts";
import { useCopyToClipboard } from "usehooks-ts";
import { FilePreviewIcon } from "../file-preview-icon";
import { TrackerTimer } from "../tracker-timer";

interface SearchItem {
  id: string;
  type: string;
  title: string;
  data?: {
    name?: string;
    email?: string;
    invoice_number?: string;
    status?: string;
    amount?: number;
    currency?: string;
    date?: string;
    display_name?: string;
    file_name?: string;
    file_path?: string[];
    path_tokens?: string[];
    title?: string;
    metadata?: {
      mimetype?: string;
    };
    template?: {
      size?: string;
    };
    url?: string;
  };
  action?: () => void;
}

function CopyButton({ path }: { path: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const [_, copy] = useCopyToClipboard();

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    copy(`${window.location.origin}${path}`);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  return (
    <button type="button" onClick={handleCopy}>
      {isCopied ? (
        <Icons.Check className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
      ) : (
        <Icons.Copy className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
      )}
    </button>
  );
}

function DownloadButton({
  href,
  filename,
}: { href: string; filename?: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const isFileDownload = href.includes("/files/download/file");
  const isInvoiceDownload = href.includes("/files/download/invoice");
  const needsAuth = isFileDownload || isInvoiceDownload;

  // Extract invoice ID if it's an invoice download
  let invoiceId: string | null = null;
  if (isInvoiceDownload) {
    try {
      invoiceId = new URL(href).searchParams.get("id");
    } catch {
      // Invalid URL, will fall back to url type
    }
  }

  const { url: authenticatedUrl, isLoading } = useFileUrl(
    needsAuth
      ? isInvoiceDownload && invoiceId
        ? { type: "invoice", invoiceId }
        : { type: "url", url: href }
      : null,
  );

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = authenticatedUrl || href;
    if (!url) return;

    try {
      setIsDownloading(true);
      await downloadFile(url, filename || "download");
      setTimeout(() => setIsDownloading(false), 1000);
    } catch (error) {
      console.error("Download failed:", error);
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={
        isDownloading || (needsAuth && (!authenticatedUrl || isLoading))
      }
    >
      {isDownloading || isLoading ? (
        <Spinner size={16} />
      ) : (
        <Icons.ArrowCoolDown className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
      )}
    </button>
  );
}

// Helper function to format group names
const formatGroupName = (name: string): string | null => {
  switch (name) {
    case "shortcut":
      return "Shortcuts";
    case "customer":
      return "Customers";
    case "vault":
      return "Vault";
    case "invoice":
      return "Invoices";
    case "tracker_project":
      return "Tracker";
    case "transaction":
      return "Transactions";
    case "inbox":
      return "Inbox";

    default:
      return null;
  }
};

const useSearchNavigation = () => {
  const router = useRouter();
  const { setOpen } = useSearchStore();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setTrackerParams } = useTrackerParams();
  const { setParams: setTransactionParams } = useTransactionParams();
  const { setParams: setDocumentParams } = useDocumentParams();

  const navigateWithParams = (
    params: Record<string, any>,
    paramSetter: (params: any) => void,
  ) => {
    setOpen();
    paramSetter(params);
  };

  const navigateToPath = (path: string) => {
    setOpen();
    router.push(path);
  };

  return {
    navigateToDocument: (params: { documentId: string }) => {
      navigateWithParams(params, setDocumentParams);
    },
    navigateToCustomer: (params: { customerId: string }) => {
      navigateWithParams(params, setCustomerParams);
    },
    navigateToInvoice: (params: {
      invoiceId: string;
      type: "details" | "create" | "edit" | "success";
    }) => {
      navigateWithParams(params, setInvoiceParams);
    },
    navigateToTracker: (params: {
      projectId?: string;
      update?: boolean;
      create?: boolean;
      selectedDate?: string;
    }) => {
      navigateWithParams(params, setTrackerParams);
    },
    navigateToTransaction: (params: {
      transactionId?: string;
      createTransaction?: boolean;
    }) => {
      navigateWithParams(params, setTransactionParams);
    },
    navigateToPath: (path: string) => {
      navigateToPath(path);
    },
    // Action helpers
    createInvoice: () => {
      navigateWithParams({ type: "create" as const }, setInvoiceParams);
    },
    createCustomer: (params = { createCustomer: true }) => {
      navigateWithParams(params, setCustomerParams);
    },
    createTransaction: () => {
      navigateWithParams(
        { createTransaction: true },
        setTransactionParams,
      );
    },
    createProject: () => {
      navigateWithParams({ create: true }, setTrackerParams);
    },
    trackTime: () => {
      navigateWithParams(
        { selectedDate: formatISO(new Date(), { representation: "date" }) },
        setTrackerParams,
      );
    },
  };
};

// Sub-component to render each search item
const SearchResultItemDisplay = ({
  item,
  dateFormat,
}: { item: SearchItem; dateFormat?: string }) => {
  const nav = useSearchNavigation();

  let icon: ReactNode | undefined;
  let resultDisplay: ReactNode;
  let onSelect: () => void;

  if (!item.data) {
    // This is an action item (e.g., "Create Invoice", "View Documents")
    icon = <Icons.Shortcut className="size-4 dark:text-[#666] text-primary" />;
    resultDisplay = item.title;
  } else {
    icon = null;
    resultDisplay = item.title;

    switch (item.type) {
      case "vault": {
        onSelect = () => nav.navigateToDocument({ documentId: item.id });

        icon = (
          <FilePreviewIcon
            mimetype={item.data?.metadata?.mimetype}
            className="size-4 dark:text-[#666] text-primary"
          />
        );
        resultDisplay = (
          <div className="flex items-center justify-between w-full">
            <span className="flex-grow truncate">
              {
                (item.data?.title ||
                  (item.data?.name as string)?.split("/").at(-1) ||
                  "") as string
              }
            </span>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`?documentId=${item.id}`} />
              <DownloadButton
                href={`${process.env.NEXT_PUBLIC_API_URL}/files/download/file?path=${item.data?.path_tokens?.join("/")}&filename=${
                  (item.data?.title ||
                    (item.data?.name as string)?.split("/").at(-1) ||
                    "") as string
                }`}
                filename={
                  (item.data?.title ||
                    (item.data?.name as string)?.split("/").at(-1) ||
                    "") as string
                }
              />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      case "customer": {
        onSelect = () => nav.navigateToCustomer({ customerId: item.id });

        icon = (
          <Icons.Customers className="size-4 dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{item.data.name as string}</span>
              <span className="text-xs text-muted-foreground">
                {item.data.email as string}
              </span>
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`?customerId=${item.id}`} />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );

        break;
      }
      case "invoice": {
        onSelect = () =>
          nav.navigateToInvoice({ invoiceId: item.id, type: "details" });

        icon = (
          <Icons.Invoice className="size-4 dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{item.data.invoice_number as string}</span>
              {/* @ts-expect-error - Unstructured data */}
              <InvoiceStatus status={item.data?.status} />
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`?invoiceId=${item.id}&type=details`} />
              <DownloadButton
                href={`${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?id=${item.id}&size=${item?.data?.template?.size}`}
                filename={`${item.data.invoice_number || "invoice"}.pdf`}
              />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      case "inbox": {
        onSelect = () => nav.navigateToPath(`/inbox?inboxId=${item.id}`);

        icon = (
          <Icons.Inbox2 size={14} className="dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center justify-between w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>
                {
                  (item.data?.display_name ||
                    (item.data?.file_name as string)?.split("/").at(-1) ||
                    "") as string
                }
              </span>
              {item.data?.amount && item.data?.currency && (
                <span className="text-xs text-muted-foreground">
                  <FormatAmount
                    currency={item.data.currency}
                    amount={item.data.amount}
                  />
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {item.data?.date && formatDate(item.data.date, dateFormat)}
              </span>
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`/inbox?inboxId=${item.id}`} />
              <DownloadButton
                href={`${process.env.NEXT_PUBLIC_API_URL}/files/download/file?path=${item.data?.file_path?.join("/")}&filename=${item.data?.file_name || ""}`}
                filename={item.data?.file_name || "download"}
              />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      case "tracker_project": {
        onSelect = () =>
          nav.navigateToTracker({ projectId: item.id, update: true });

        icon = null; // TrackerTimer will handle its own icon
        resultDisplay = (
          <div className="flex items-center w-full">
            <div className="flex-grow min-w-0 -ml-[6px]">
              <TrackerTimer
                projectId={item.id}
                projectName={item.data.name as string}
                onClick={() =>
                  nav.navigateToTracker({ projectId: item.id, update: true })
                }
                alwaysShowButton={true}
              />
            </div>
          </div>
        );
        break;
      }
      case "transaction": {
        onSelect = () => nav.navigateToTransaction({ transactionId: item.id });

        icon = (
          <Icons.Transactions className="size-4 dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center justify-between w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{(item.data?.name || "") as string}</span>
              <span className="text-xs text-muted-foreground">
                <FormatAmount
                  currency={item.data?.currency as string}
                  amount={item.data?.amount as number}
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {item.data?.date
                  ? formatDate(item.data.date, dateFormat)
                  : null}
              </span>
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={item.data?.url as string} />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      default:
        // For types not explicitly handled but have data,
        // icon remains the default data icon, and resultDisplay remains item.title.
        // This is fine.
        break;
    }
  }

  const handleSelect = () => {
    item.action?.();
    onSelect?.();
  };

  return (
    <CommandItem
      key={item.id}
      value={item.id}
      onSelect={handleSelect}
      className="text-sm flex flex-col items-start gap-1 py-2 group/item"
    >
      <div className="flex items-center gap-2 w-full">
        {icon}
        {resultDisplay}
      </div>
    </CommandItem>
  );
};

export function Search() {
  const { data: user } = useUserQuery();
  const [debounceDelay, setDebounceDelay] = useState(200);
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const height = useRef<HTMLDivElement>(null);
  const nav = useSearchNavigation();
  const trpc = useTRPC();

  // Get current timer status to prioritize tracker section
  const { data: timerStatus, refetch: refetchTimerStatus } = useQuery({
    ...trpc.trackerEntries.getTimerStatus.queryOptions(),
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  useHotkeys(
    "esc",
    () => {
      setDebouncedSearch("");
    },
    {
      enableOnFormTags: true,
    },
  );

  // Refetch timer status when search component mounts
  useEffect(() => {
    refetchTimerStatus();
  }, [refetchTimerStatus]);

  const [debouncedSearch, setDebouncedSearch] = useDebounceValue(
    "",
    debounceDelay,
  );

  const sectionActions: SearchItem[] = [
    {
      id: "sc-create-invoice",
      type: "invoice",
      title: "Create invoice",
      action: nav.createInvoice,
    },
    {
      id: "sc-create-customer",
      type: "customer",
      title: "Create customer",
      action: nav.createCustomer,
    },
    {
      id: "sc-create-transaction",
      type: "transaction",
      title: "Create transaction",
      action: nav.createTransaction,
    },
    {
      id: "sc-create-project",
      type: "tracker_project",
      title: "Create project",
      action: nav.createProject,
    },
    {
      id: "sc-track-time",
      type: "tracker_project",
      title: "Track time",
      action: nav.trackTime,
    },
    {
      id: "sc-view-documents",
      type: "vault",
      title: "View vault",
      action: () => nav.navigateToPath("/vault"),
    },
    {
      id: "sc-view-customers",
      type: "customer",
      title: "View customers",
      action: () => nav.navigateToPath("/customers"),
    },
    {
      id: "sc-view-transactions",
      type: "transaction",
      title: "View transactions",
      action: () => nav.navigateToPath("/transactions"),
    },
    {
      id: "sc-view-inbox",
      type: "inbox",
      title: "View inbox",
      action: () => nav.navigateToPath("/inbox"),
    },
    {
      id: "sc-view-invoices",
      type: "invoice",
      title: "View invoices",
      action: () => nav.navigateToPath("/invoices"),
    },
    {
      id: "sc-view-tracker",
      type: "tracker_project",
      title: "View tracker",
      action: () => nav.navigateToPath("/tracker"),
    },
  ];

  // Fetch data using useQuery
  const {
    data: queryResult,
    isLoading,
    isFetching,
  } = useQuery({
    ...trpc.search.global.queryOptions({
      searchTerm: debouncedSearch,
    }),
    placeholderData: (previousData) => previousData,
  });

  // Extract search results array from queryResult
  const searchResults: SearchItem[] = queryResult || [];

  const combinedData = useMemo(() => {
    // Type assertion for searchResults from DB to ensure they have actions if needed,
    // or map them to include default actions. For now, assuming they come with 'type' and 'title'.
    const mappedSearchResults = searchResults.map((res) => ({
      ...res,
      action: () => {},
    }));
    return [...mappedSearchResults];
  }, [debouncedSearch, searchResults]);

  const groupedData = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    // Group search results first
    for (const item of combinedData) {
      const groupKey = item.type || "other";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }

    // Filter sectionActions based on debouncedSearch
    const filteredSectionActions = debouncedSearch
      ? sectionActions.filter((action) =>
          action.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
        )
      : sectionActions;

    // Add filtered sectionActions to their respective groups
    for (const actionItem of filteredSectionActions) {
      const groupKey = actionItem.type;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(actionItem);
    }

    // Sort tracker projects to put the running project first
    const trackerProjectKey = "tracker_project";
    if (groups[trackerProjectKey] && timerStatus?.currentEntry?.projectId) {
      const runningProjectId = timerStatus.currentEntry.projectId;
      groups[trackerProjectKey] = groups[trackerProjectKey].sort((a, b) => {
        // Put the running project first
        if (a.id === runningProjectId && b.id !== runningProjectId) return -1;
        if (b.id === runningProjectId && a.id !== runningProjectId) return 1;
        return 0; // Keep original order for non-running projects
      });
    }

    // Prioritize tracker projects when timer is running
    const definedGroupOrder = timerStatus?.isRunning
      ? [
          "tracker_project",
          "vault",
          "customer",
          "invoice",
          "transaction",
          "inbox",
        ]
      : [
          "vault",
          "customer",
          "invoice",
          "transaction",
          "tracker_project",
          "inbox",
        ];

    const allGroupKeysInOrder: string[] = [];
    const addedKeys = new Set<string>();

    // Add groups based on defined order if they exist
    for (const key of definedGroupOrder) {
      if (groups[key]) {
        allGroupKeysInOrder.push(key);
        addedKeys.add(key);
      }
    }
    // Add any remaining groups that weren't in the defined order
    for (const key in groups) {
      if (groups[key] && groups[key].length > 0 && !addedKeys.has(key)) {
        allGroupKeysInOrder.push(key);
        addedKeys.add(key);
      }
    }

    const orderedGroups: Record<string, SearchItem[]> = {};
    for (const key of allGroupKeysInOrder) {
      if (groups[key] && groups[key].length > 0) {
        // Ensure group is not empty before adding
        orderedGroups[key] = groups[key];
      }
    }
    return orderedGroups;
  }, [
    combinedData,
    debouncedSearch,
    timerStatus?.isRunning,
    timerStatus?.currentEntry?.projectId,
  ]);

  useEffect(() => {
    if (height.current && ref.current) {
      const el = height.current;
      const wrapper = ref.current;
      let animationFrame: number;
      const observer = new ResizeObserver(() => {
        animationFrame = requestAnimationFrame(() => {
          const newHeight = el.offsetHeight;
          wrapper.style.setProperty("--search-list-height", `${newHeight}px`);
        });
      });
      observer.observe(el);
      return () => {
        cancelAnimationFrame(animationFrame);
        observer.unobserve(el);
      };
    }
  }, []);

  return (
    <Command
      shouldFilter={false}
      className="search-container overflow-hidden p-0 relative w-full bg-background backdrop-filter backdrop-blur-lg dark:bg-[#0C0C0C]/[99] h-auto border border-border"
    >
      <div className="border-b border-border relative">
        <CommandInput
          ref={searchInputRef}
          placeholder="Type a command or search..."
          onValueChange={(value: string) => {
            setDebouncedSearch(value);

            // If the search term is longer than 1 word, increase the debounce delay
            if (value.trim().split(/\s+/).length > 1) {
              setDebounceDelay(700);
            } else {
              setDebounceDelay(200);
            }
          }}
          className="px-4 h-[55px] py-0"
        />
        {isFetching && (
          <div className="absolute bottom-0 h-[2px] w-full overflow-hidden">
            <div className="absolute top-[1px] h-full w-40 animate-slide-effect bg-gradient-to-r dark:from-gray-800 dark:via-white dark:via-80% dark:to-gray-800 from-gray-200 via-black via-80% to-gray-200" />
          </div>
        )}
      </div>

      <div className="px-2 global-search-list" ref={ref}>
        <CommandList ref={height} className="scrollbar-hide">
          {!isLoading && combinedData.length === 0 && debouncedSearch && (
            <CommandEmpty>
              No results found for "{debouncedSearch}".
            </CommandEmpty>
          )}
          {!isLoading &&
            Object.entries(groupedData).map(([groupName, items]) => (
              <CommandGroup
                key={groupName}
                heading={formatGroupName(groupName)}
              >
                {items.map((item: SearchItem) => (
                  <SearchResultItemDisplay
                    key={item.id}
                    item={item}
                    dateFormat={user?.dateFormat ?? undefined}
                  />
                ))}
              </CommandGroup>
            ))}
        </CommandList>
      </div>
    </Command>
  );
}
