import { searchAction } from "@/actions/search-action";
import { Combobox } from "@midday/ui/combobox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { isSupportedFilePreview } from "@midday/utils";
import { useDebounce } from "@uidotdev/usehooks";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";

type Props = {
  placeholder: string;
  onSelect: (file: any) => void;
};

export function SelectAttachment({ placeholder, onSelect }: Props) {
  const [items, setItems] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const debouncedSearchTerm = useDebounce(query, 300);

  const search = useAction(searchAction, {
    onSuccess: ({ data }) => {
      setItems(data);
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  useEffect(() => {
    if (debouncedSearchTerm) {
      search.execute({ query: debouncedSearchTerm, type: "inbox" });
    } else {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  const options = items?.map((item) => ({
    id: item.id,
    name: item.display_name,
    data: item,
    component: () => {
      const filePreviewSupported = isSupportedFilePreview(item.content_type);

      return (
        <HoverCard openDelay={200}>
          <HoverCardTrigger className="w-full">
            <div className="dark:text-white flex w-full">
              <div className="w-[50%] line-clamp-1 text-ellipsis overflow-hidden pr-8">
                {item.display_name}
              </div>
              <div className="w-[70px]">
                {item.date ? format(new Date(item.date), "d MMM") : "-"}
              </div>
              <div className="flex-1 text-right">
                {item.amount && item.currency && (
                  <FormatAmount amount={item.amount} currency={item.currency} />
                )}
              </div>
            </div>
          </HoverCardTrigger>

          {filePreviewSupported && (
            <HoverCardContent
              className="w-[273px] h-[358px] p-0 overflow-hidden"
              side="left"
              sideOffset={55}
            >
              <FilePreview
                src={`/api/proxy?filePath=vault/${item?.file_path?.join("/")}`}
                name={item.name}
                type={item.content_type}
                width={280}
                height={365}
                disableFullscreen
              />
            </HoverCardContent>
          )}
        </HoverCard>
      );
    },
  }));

  return (
    <Combobox
      className="border border-border p-2 pl-10"
      placeholder={placeholder}
      onValueChange={(query) => {
        setLoading(true);
        setQuery(query);
      }}
      onSelect={onSelect}
      options={isLoading ? [] : options}
      isLoading={isLoading}
      classNameList="mt-2"
    />
  );
}
