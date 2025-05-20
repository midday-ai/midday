import { useDocumentParams } from "@/hooks/use-document-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import { Combobox } from "@midday/ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";

type Props = {
  placeholder: string;
  onSelect: (file: any) => void;
};

export function SelectAttachment({ placeholder, onSelect }: Props) {
  const [debouncedValue, setDebouncedValue] = useDebounceValue("", 200);
  const { data: user } = useUserQuery();
  const { setParams } = useDocumentParams();

  const trpc = useTRPC();

  const { data: items, isLoading } = useQuery({
    ...trpc.inbox.search.queryOptions({
      query: debouncedValue,
      limit: 10,
    }),
    enabled: Boolean(debouncedValue),
  });

  const handleOnSelect = (item: any) => {
    onSelect(item);
  };

  const options = items?.map((item) => ({
    id: item.id,
    name: item.displayName,
    data: item,
    component: () => {
      const filePath = `${item?.filePath?.join("/")}`;

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
                <FilePreview mimeType={item.contentType!} filePath={filePath} />
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
            {item?.amount && item?.currency && (
              <FormatAmount amount={item.amount} currency={item.currency} />
            )}
          </div>
        </div>
      );
    },
  }));

  return (
    <Combobox
      className="border border-border p-2 pl-10"
      placeholder={placeholder}
      onValueChange={(query) => {
        setDebouncedValue(query);
      }}
      onSelect={handleOnSelect}
      options={isLoading ? [] : options}
      isLoading={isLoading}
      classNameList="mt-2 max-h-[161px]"
    />
  );
}
