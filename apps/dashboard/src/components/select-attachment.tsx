import { TZDate } from "@date-fns/tz";
import { Badge } from "@midday/ui/badge";
import { Combobox } from "@midday/ui/combobox";
import { Icons } from "@midday/ui/icons";
import { formatDate } from "@midday/utils/format";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";

type Attachment = {
  id: string;
  name: string;
  data?: unknown;
  type?: "inbox" | "invoice";
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

  // Only fetch suggestions when user is actively searching (not just on focus)
  const { data: items, isLoading } = useQuery({
    ...trpc.search.attachments.queryOptions({
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
  // Only show results when actively searching or when combobox is open AND user has typed something
  // Don't show suggestions when just focusing the input
  const shouldShowResults = isOpen && Boolean(debouncedValue) && hasResults;

  const options = hasResults
    ? items.map((item, index) => {
        const isInvoice = item.type === "invoice";
        // Handle filePath - can be array or null/empty
        // For invoices, filePath should be teamId/invoices/filename.pdf format
        let filePath: string | null = null;
        if (Array.isArray(item.filePath) && item.filePath.length > 0) {
          filePath = item.filePath.join("/");
        } else if (item.filePath === null || item.filePath === undefined) {
          filePath = null;
        }

        // For invoices, ensure filePath is valid before showing preview
        const canShowPreview = filePath && filePath.length > 0;
        const displayName = isInvoice
          ? item.invoiceNumber || "Invoice"
          : item.displayName || item.fileName || "";

        // Build secondary text with most important matching info
        let secondaryText: string | undefined;
        if (isInvoice) {
          // For invoices: customer name + due date (most important for identification)
          const parts: string[] = [];
          if (item.customerName) parts.push(item.customerName);
          if (item.dueDate) {
            // Use TZDate for invoice dates (stored as UTC midnight)
            const tzDate = new TZDate(item.dueDate, "UTC");
            parts.push(format(tzDate, user?.dateFormat ?? "MMM d"));
          }
          secondaryText = parts.length > 0 ? parts.join(" • ") : undefined;
        } else {
          // For inbox items: date is most important for matching, then description if available
          const parts: string[] = [];
          if (item.date) {
            parts.push(formatDate(item.date, user?.dateFormat));
          }
          // Add description if available and not too long (truncate if needed)
          if (item.description && item.description.length > 0) {
            const maxDescLength = 40;
            const truncatedDesc =
              item.description.length > maxDescLength
                ? `${item.description.substring(0, maxDescLength)}...`
                : item.description;
            parts.push(truncatedDesc);
          }
          secondaryText = parts.length > 0 ? parts.join(" • ") : undefined;
        }

        const isSmartSuggestion = debouncedValue.length === 0 && transactionId;
        const showBestMatch =
          isSmartSuggestion && index === 0 && items?.length > 1;

        return {
          id: item.id,
          name: displayName,
          type: item.type,
          data: item,
          component: () => (
            <div className="flex w-full items-center justify-between gap-2 text-sm">
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 overflow-hidden flex items-center justify-center">
                  {canShowPreview && filePath ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setParams({ filePath: filePath! });
                      }}
                    >
                      <FilePreview
                        mimeType={
                          isInvoice
                            ? "application/pdf"
                            : item.contentType || "application/pdf"
                        }
                        filePath={filePath!}
                        lazy
                      />
                    </button>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Icons.PdfOutline className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-sm">{displayName}</span>
                  {secondaryText && (
                    <span className="text-muted-foreground text-xs">
                      {secondaryText}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-4 text-xs">
                {showBestMatch && (
                  <Badge variant="outline" className="px-2 py-0">
                    Best Match
                  </Badge>
                )}
                {item.amount && item.currency && (
                  <FormatAmount amount={item.amount} currency={item.currency} />
                )}
              </div>
            </div>
          ),
        };
      })
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
