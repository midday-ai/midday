"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUserQuery } from "@/hooks/use-user";
import { useSearchStore } from "@/store/search";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useCopyToClipboard } from "usehooks-ts";
import { FilePreviewIcon } from "../file-preview-icon";

interface SearchItem {
  id: string;
  type: string;
  title: string;
  data?: Record<string, unknown>;
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

function DownloadButton({ href }: { href: string }) {
  return (
    <a
      type="a"
      href={href}
      download
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Icons.ArrowCoolDown className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
    </a>
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
      return "Tracker Projects";
    case "transaction":
      return "Transactions";
    case "inbox":
      return "Inbox";

    default:
      return null;
  }
};

// Sub-component to render each search item
const SearchResultItemDisplay = ({
  item,
  dateFormat,
}: { item: SearchItem; dateFormat?: string }) => {
  const router = useRouter();
  const { setOpen } = useSearchStore();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setTrackerParams } = useTrackerParams();
  const { setParams: setTransactionParams } = useTransactionParams();
  const { setParams: setDocumentParams } = useDocumentParams();

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
        onSelect = () => {
          setOpen();
          setDocumentParams({
            documentId: item.id,
          });
        };

        icon = (
          <FilePreviewIcon
            // @ts-expect-error - Unstructured data
            mimetype={item.data?.metadata?.mimetype}
            className="size-4 dark:text-[#666] text-primary"
          />
        );
        resultDisplay = (
          <div className="flex items-center justify-between w-full">
            <span className="flex-grow truncate">
              {/* @ts-expect-error - Unstructured data */}
              {item.data.title ||
                (item.data?.name as string)?.split("/").at(-1)}
            </span>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`?documentId=${item.id}`} />
              <DownloadButton
                href={`/api/download/file?path=${item.data.path_tokens?.join("/")}&filename=${
                  item.data.title ||
                  (item.data?.name as string)?.split("/").at(-1)
                }`}
              />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      case "customer": {
        onSelect = () => {
          setOpen();
          setCustomerParams({
            customerId: item.id,
          });
        };

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
        onSelect = () => {
          setOpen();
          setInvoiceParams({
            invoiceId: item.id,
            type: "details",
          });
        };

        icon = (
          <Icons.Invoice className="size-4 dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{item.data.invoice_number as string}</span>
              <InvoiceStatus status={item.data?.status as string} />
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`?invoiceId=${item.id}&type=details`} />
              <DownloadButton
                href={`/api/download/invoice?id=${item.id}&size=${item?.data?.template?.size}`}
              />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      case "inbox": {
        onSelect = () => {
          setOpen();
          router.push(`/inbox?inboxId=${item.id}`);
        };

        icon = (
          <Icons.Inbox2 size={14} className="dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center justify-between w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>
                {
                  (item.data.display_name ||
                    (item.data.file_name as string)
                      ?.split("/")
                      .at(-1)) as string
                }
              </span>
              {/* @ts-expect-error - Unstructured data */}
              {item.data.amount && item.data.currency && (
                <span className="text-xs text-muted-foreground">
                  <FormatAmount
                    currency={item.data.currency as string}
                    amount={item.data.amount as number}
                  />
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {item.data.date &&
                  formatDate(item.data.date as string, dateFormat)}
              </span>
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`/inbox?inboxId=${item.id}`} />
              <DownloadButton
                href={`/api/download/file?path=${item.data?.file_path?.join(
                  "/",
                )}&filename=${item.data?.file_name}`}
              />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      case "tracker_project": {
        onSelect = () => {
          setOpen();
          setTrackerParams({
            projectId: item.id,
            update: true,
          });
        };
        icon = (
          <Icons.Tracker className="size-4 dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{item.data.name as string}</span>
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton path={`?projectId=${item.id}&update=true`} />
              <Icons.ArrowOutward className="size-4 dark:text-[#666] text-primary hover:!text-primary cursor-pointer" />
            </div>
          </div>
        );
        break;
      }
      case "transaction": {
        onSelect = () => {
          setOpen();
          setTransactionParams({
            transactionId: item.id,
          });
        };

        icon = (
          <Icons.Transactions className="size-4 dark:text-[#666] text-primary" />
        );
        resultDisplay = (
          <div className="flex items-center justify-between w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{item.data.name as string}</span>
              <span className="text-xs text-muted-foreground">
                <FormatAmount
                  currency={item.data.currency as string}
                  amount={item.data.amount as number}
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {item.data.date &&
                  formatDate(item.data.date as string, dateFormat)}
              </span>
            </div>
            <div className="flex items-center gap-2 invisible group-hover/item:visible group-focus/item:visible group-aria-selected/item:visible">
              <CopyButton url={item.data?.url as string} />
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
  const height = useRef<HTMLDivElement>(null);
  const { setOpen } = useSearchStore();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setTrackerParams } = useTrackerParams();
  const { setParams: setTransactionParams } = useTransactionParams();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    setOpen();
    router.push(path);
  };

  const [debouncedSearch, setDebouncedSearch] = useDebounceValue(
    "",
    debounceDelay,
  );
  const trpc = useTRPC();

  const sectionActions: SearchItem[] = [
    {
      id: "sc-create-invoice",
      type: "invoice",
      title: "Create invoice",
      action: () => {
        setOpen();
        setInvoiceParams({
          type: "create",
        });
      },
    },
    {
      id: "sc-create-customer",
      type: "customer",
      title: "Create customer",
      action: () => {
        setOpen();
        setCustomerParams({
          createCustomer: true,
        });
      },
    },
    {
      id: "sc-create-transaction",
      type: "transaction",
      title: "Create transaction",
      action: () => {
        setOpen();
        setTransactionParams({
          createTransaction: true,
        });
      },
    },
    {
      id: "sc-create-project",
      type: "tracker_project",
      title: "Create project",
      action: () => {
        setOpen();
        setTrackerParams({
          create: true,
        });
      },
    },
    {
      id: "sc-track-time",
      type: "tracker_project",
      title: "Track time",
      action: () => {
        setOpen();
        setTrackerParams({
          selectedDate: formatISO(new Date(), { representation: "date" }),
        });
      },
    },
    {
      id: "sc-view-documents",
      type: "vault",
      title: "View vault",
      action: () => handleNavigation("/vault"),
    },
    {
      id: "sc-view-customers",
      type: "customer",
      title: "View customers",
      action: () => handleNavigation("/customers"),
    },
    {
      id: "sc-view-transactions",
      type: "transaction",
      title: "View transactions",
      action: () => handleNavigation("/transactions"),
    },
    {
      id: "sc-view-inbox",
      type: "inbox",
      title: "View inbox",
      action: () => handleNavigation("/inbox"),
    },
    {
      id: "sc-view-invoices",
      type: "invoice",
      title: "View invoices",
      action: () => handleNavigation("/invoices"),
    },
    {
      id: "sc-view-tracker",
      type: "tracker_project",
      title: "View tracker",
      action: () => handleNavigation("/tracker"),
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
  const searchResults: SearchItem[] = queryResult?.data || [];

  const combinedData = useMemo(() => {
    // Type assertion for searchResults from DB to ensure they have actions if needed,
    // or map them to include default actions. For now, assuming they come with 'type' and 'title'.
    const mappedSearchResults = searchResults.map((res) => ({
      ...res,
      action: () => console.log(`Selected DB Item: ${res.type} - ${res.title}`),
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

    const definedGroupOrder = [
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
  }, [combinedData, debouncedSearch]);

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
      className="overflow-hidden p-0 relative w-full bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#151515]/[99] h-auto border border-border"
    >
      <div className="border-b border-border relative">
        <CommandInput
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
                    dateFormat={user?.date_format ?? undefined}
                  />
                ))}
              </CommandGroup>
            ))}
        </CommandList>
      </div>
    </Command>
  );
}
