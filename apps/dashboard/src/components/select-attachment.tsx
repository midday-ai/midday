import { useDocumentParams } from "@/hooks/use-document-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Badge } from "@midday/ui/badge";
import { Combobox } from "@midday/ui/combobox";
import { formatDate } from "@midday/utils/format";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";

type Attachment = {
  id: string;
  name: string;
  data?: unknown;
};

type Props = {
  placeholder: string;
  onSelect: (file: Attachment) => void;
  transactionId?: string;
};

export function SelectAttachment({
  placeholder,
  onSelect,
  transactionId,
}: Props) {
  const [debouncedValue, setDebouncedValue] = useDebounceValue("", 200);
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useUserQuery();
  const { setParams } = useDocumentParams();

  const trpc = useTRPC();

  // Always fetch suggestions/search results so they're ready when sheet opens
  const { data: items, isLoading } = useQuery({
    ...trpc.inbox.search.queryOptions({
      q: debouncedValue.length > 0 ? debouncedValue : undefined,
      transactionId: debouncedValue.length > 0 ? undefined : transactionId,
      limit: debouncedValue.length > 0 ? 30 : 3,
    }),
    enabled: Boolean(debouncedValue.length > 0 || transactionId), // Enable for search OR suggestions
  });

  const handleOnSelect = (item: Attachment) => {
    onSelect(item);
  };

  // Only create options if we have items and should show results
  const hasResults = items && items.length > 0;
  const shouldShowResults = isOpen && (Boolean(debouncedValue) || hasResults);

  const options = hasResults
    ? items.map((item, index) => ({
        id: item.id,
        name: item.displayName,
        data: item,
        component: () => {
          const filePath = `${item?.filePath?.join("/")}`;
          const isSmartSuggestion =
            debouncedValue.length === 0 && transactionId;
          const showBestMatch =
            isSmartSuggestion && index === 0 && items?.length > 1;

          return (
            <div className="flex w-full items-center justify-between gap-2 text-sm">
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setParams({ filePath });
                    }}
                  >
                    <FilePreview
                      mimeType={item.contentType!}
                      filePath={filePath}
                    />
                  </button>
                </div>
                <div className="flex flex-col">
                  <span className="truncate">
                    {item.displayName || item.fileName}
                  </span>
                  {item?.date && (
                    <span className="text-muted-foreground text-xs">
                      {formatDate(item.date, user?.dateFormat, true)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-4">
                {showBestMatch && (
                  <Badge variant="outline" className="px-2 py-0">
                    Best Match
                  </Badge>
                )}
                {item?.amount && item?.currency && (
                  <FormatAmount amount={item.amount} currency={item.currency} />
                )}
              </div>
            </div>
          );
        },
      }))
    : [];

  const handleFocus = () => {
    if (!isOpen && !debouncedValue) {
      setIsOpen(true);
    }
  };

  return (
    <Combobox
      className="border border-border p-2 pl-10"
      placeholder={placeholder}
      onValueChange={(query) => {
        setDebouncedValue(query);
      }}
      onSelect={(value) => {
        if (value) {
          handleOnSelect(value);
        }
      }}
      options={options.map((opt) => ({
        ...opt,
        name: opt.name!,
      }))}
      isLoading={isLoading && Boolean(debouncedValue)} // Only show loading when actively searching
      classNameList="mt-2 max-h-[161px]"
      open={shouldShowResults} // Only open when we should show results
      onOpenChange={setIsOpen}
      onFocus={handleFocus}
    />
  );
}
