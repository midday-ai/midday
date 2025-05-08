"use client";

import { FormatAmount } from "@/components/format-amount";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import { Badge } from "@midday/ui/badge";
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
import { useEffect, useMemo, useRef } from "react";
import { useDebounceValue } from "usehooks-ts";
import { FilePreviewIcon } from "../file-preview-icon";

// Define item types
interface ShortcutItem {
  id: string;
  type: "shortcut";
  label: string;
  shortcutText?: string;
  action?: () => void;
}

interface SearchResultDbItem {
  id: string;
  type: string; // e.g., "document", "customer", "invoice"
  title: string;
  // Add other relevant fields from DB item:
  // relevance?: number;
  // created_at?: string;
  // data?: Json; // For more complex actions
  action?: () => void;
}

type CombinedItem = ShortcutItem | SearchResultDbItem;

const staticShortcutItems: ShortcutItem[] = [
  {
    id: "sc-create-invoice",
    type: "shortcut",
    label: "Create invoice",
    shortcutText: "⌘I",
    action: () => console.log("Action: Create Invoice"),
  },
  {
    id: "sc-create-customer",
    type: "shortcut",
    label: "Create customer",
    shortcutText: "⌘C",
    action: () => console.log("Action: Create Customer"),
  },
  {
    id: "sc-create-transaction",
    type: "shortcut",
    label: "Create transaction",
    shortcutText: "⌘T",
    action: () => console.log("Action: Create Transaction"),
  },
  {
    id: "sc-track-time",
    type: "shortcut",
    label: "Track time",
    shortcutText: "⌘P",
    action: () => console.log("Action: Track Time"),
  },
  {
    id: "sc-create-project",
    type: "shortcut",
    label: "Create project",
    shortcutText: "⌘P",
    action: () => console.log("Action: Create Project"),
  }, // Note: ⌘P is duplicated, consider different shortcuts
  {
    id: "sc-view-documents",
    type: "shortcut",
    label: "View documents",
    shortcutText: "⌘D",
    action: () => console.log("Action: View Documents"),
  },
  {
    id: "sc-view-customers",
    type: "shortcut",
    label: "View customers",
    shortcutText: "⌘C",
    action: () => console.log("Action: View Customers"),
  }, // Note: ⌘C is duplicated
  {
    id: "sc-view-transactions",
    type: "shortcut",
    label: "View transactions",
    shortcutText: "⌘T",
    action: () => console.log("Action: View Transactions"),
  }, // Note: ⌘T is duplicated
  {
    id: "sc-view-inbox",
    type: "shortcut",
    label: "View inbox",
    shortcutText: "⌘I",
    action: () => console.log("Action: View Inbox"),
  }, // Note: ⌘I is duplicated
  {
    id: "sc-view-invoices",
    type: "shortcut",
    label: "View invoices",
    shortcutText: "⌘I",
    action: () => console.log("Action: View Invoices"),
  }, // Note: ⌘I is duplicated
  {
    id: "sc-view-tracker",
    type: "shortcut",
    label: "View tracker",
    shortcutText: "⌘P",
    action: () => console.log("Action: View Tracker"),
  }, // Note: ⌘P is duplicated
];

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
}: { item: CombinedItem; dateFormat?: string }) => {
  let icon = <Icons.Shortcut className="size-4 text-[#666]" />; // Default icon
  let result = null;

  const handleSelect = () => {
    if (item.action) {
      item.action();
    } else {
      console.log("Selected:", item);
    }
  };

  switch (item.type) {
    case "shortcut":
      icon = <Icons.Shortcut className="size-4 text-[#666]" />;
      result = (item as ShortcutItem).label;
      break;
    // Example types from a database search
    case "vault":
      {
        icon = (
          <FilePreviewIcon
            mimetype={item.data?.metadata?.mimetype}
            className="size-4 text-[#666]"
          />
        );
        result = (
          <div className="flex items-center justify-between w-full group">
            <span className="flex-grow truncate">
              {item.data.title || item.data?.name?.split("/").at(-1)}
            </span>
            <div className="flex items-center gap-2 invisible group-hover:visible group-focus:visible">
              <Icons.Copy className="size-4 text-[#666] hover:text-primary cursor-pointer" />
              <Icons.ArrowCoolDown className="size-4 text-[#666] hover:text-primary cursor-pointer" />
              <Icons.ArrowOutward className="size-4 text-[#666] hover:text-primary cursor-pointer" />
            </div>
          </div>
        );
      }
      break;
    case "customer":
      icon = <Icons.Customers className="size-4 text-[#666]" />;
      result = (
        <div className="flex items-center w-full group">
          <div className="flex-grow truncate flex gap-2 items-center">
            <span>{item.data.name}</span>
            <span className="text-xs text-muted-foreground">
              {item.data.email}
            </span>
          </div>
          <div className="flex items-center gap-2 invisible group-hover:visible group-focus:visible">
            <Icons.Copy className="size-4 text-[#666] hover:text-primary cursor-pointer" />
            <Icons.ArrowOutward className="size-4 text-[#666] hover:text-primary cursor-pointer" />
          </div>
        </div>
      );
      break;
    // case "invoice":
    //   icon = <Icons.Invoice className="size-4 text-[#666]" />;
    //   displayLabel = (item as SearchResultDbItem).title;
    //   break;
    case "inbox":
      icon = <Icons.Inbox2 size={14} className="text-[#666]" />;
      result = (
        <div className="flex items-center justify-between w-full group">
          <div className="flex-grow truncate flex gap-2 items-center">
            <span>
              {item.data.display_name || item.data.file_name.split("/").at(-1)}
            </span>
            {item.data.amount && item.data.currency && (
              <span className="text-xs text-muted-foreground">
                <FormatAmount
                  currency={item.data.currency}
                  amount={item.data.amount}
                />
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {item.data.date && formatDate(item.data.date, dateFormat)}
            </span>
          </div>
          <div className="flex items-center gap-2 invisible group-hover:visible group-focus:visible">
            <Icons.Copy className="size-4 text-[#666] hover:text-primary cursor-pointer" />
            <Icons.ArrowCoolDown className="size-4 text-[#666] hover:text-primary cursor-pointer" />
            <Icons.ArrowOutward className="size-4 text-[#666] hover:text-primary cursor-pointer" />
          </div>
        </div>
      );
      break;
    // case "tracker_project":
    //   icon = <Icons.Tracker className="size-4 text-[#666]" />;
    //   displayLabel = (item as SearchResultDbItem).title;
    //   break;
    case "transaction":
      icon = <Icons.Transactions className="size-4 text-[#666]" />;
      result = (
        <div className="flex items-center justify-between w-full group">
          <div className="flex-grow truncate flex gap-2 items-center">
            <span>{item.data.name}</span>
            <span className="text-xs text-muted-foreground">
              <FormatAmount
                currency={item.data.currency}
                amount={item.data.amount}
              />
            </span>
            <span className="text-xs text-muted-foreground">
              {item.data.date && formatDate(item.data.date, dateFormat)}
            </span>
          </div>
          <div className="flex items-center gap-2 invisible group-hover:visible group-focus:visible">
            <Icons.Copy className="size-4 text-[#666] hover:text-primary cursor-pointer" />
            <Icons.ArrowOutward className="size-4 text-[#666] hover:text-primary cursor-pointer" />
          </div>
        </div>
      );

      break;

    default:
      // Attempt to provide a sensible default for unknown DB item types
      //   displayLabel = (item as SearchResultDbItem).title || "Unknown Item";
      break;
  }

  return (
    <CommandItem
      key={item.id}
      value={item.id}
      onSelect={handleSelect}
      className="text-sm flex flex-col items-start gap-1 py-2"
    >
      <div className="flex items-center gap-2 w-full">
        {icon}
        {result}
        {item.type === "shortcut" && (item as ShortcutItem).shortcutText && (
          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {(item as ShortcutItem).shortcutText}
          </span>
        )}
      </div>
    </CommandItem>
  );
};

export function Search() {
  const { data: user } = useUserQuery();
  const ref = useRef<HTMLDivElement>(null);
  const height = useRef<HTMLDivElement>(null);

  const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 200);
  const trpc = useTRPC();

  // Fetch data using useQuery
  const { data: queryResult, isLoading } = useQuery(
    trpc.search.global.queryOptions({
      searchTerm: debouncedSearch,
    }),
  );

  // Extract search results array from queryResult
  const searchResults: SearchResultDbItem[] = (queryResult as any)?.data || [];
  console.log("[Search] searchResults:", searchResults);

  const combinedData = useMemo(() => {
    if (!debouncedSearch) {
      // If no search term, only show shortcuts
      return staticShortcutItems;
    }
    // Type assertion for searchResults from DB to ensure they have actions if needed,
    // or map them to include default actions. For now, assuming they come with 'type' and 'title'.
    const mappedSearchResults = searchResults.map((res) => ({
      ...res,
      action: () => console.log(`Selected DB Item: ${res.type} - ${res.title}`),
    }));
    return [...mappedSearchResults];
  }, [debouncedSearch, searchResults]);

  const groupedData = useMemo(() => {
    const groups: Record<string, CombinedItem[]> = {};
    for (const item of combinedData) {
      const groupKey = item.type || "other";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }
    const groupOrder = [
      "shortcut",
      ...Object.keys(groups).filter((k) => k !== "shortcut"),
    ];
    const orderedGroups: Record<string, CombinedItem[]> = {};
    for (const key of groupOrder) {
      if (groups[key]) {
        orderedGroups[key] = groups[key];
      }
    }
    return orderedGroups;
  }, [combinedData]);

  useEffect(() => {
    if (height.current && ref.current) {
      const el = height.current;
      const wrapper = ref.current;
      let animationFrame: number;
      const observer = new ResizeObserver(() => {
        animationFrame = requestAnimationFrame(() => {
          const newHeight = el.offsetHeight;
          console.log("[Search] Calculated newHeight for list:", newHeight);
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
      className="overflow-hidden p-0 w-full bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#151515]/[99] h-auto border border-border"
    >
      <div className="border-b border-border">
        <CommandInput
          placeholder="Type a command or search..."
          onValueChange={(value: string) => setDebouncedSearch(value)}
          className="px-4 h-[55px] py-0"
        />
      </div>

      <div className="px-2 global-search-list" ref={ref}>
        <CommandList ref={height} className="scrollbar-hide">
          {/* {isLoading && (
            <div className="p-4 text-sm text-center">Loading results...</div>
          )} */}
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
                {items.map((item: CombinedItem) => (
                  <SearchResultItemDisplay
                    key={item.id}
                    item={item}
                    dateFormat={user?.date_format}
                  />
                ))}
              </CommandGroup>
            ))}
        </CommandList>
      </div>
    </Command>
  );
}
