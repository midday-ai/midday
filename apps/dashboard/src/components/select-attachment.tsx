import { useTRPC } from "@/trpc/client";
import { Combobox } from "@midday/ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import { FileViewer } from "./file-viewer";

type Props = {
  placeholder: string;
  onSelect: (file: any) => void;
};

export function SelectAttachment({ placeholder, onSelect }: Props) {
  const [debouncedValue, setValue] = useDebounceValue("", 200);

  const trpc = useTRPC();

  const { data: items, isLoading } = useQuery({
    ...trpc.inbox.search.queryOptions({
      query: debouncedValue,
      limit: 10,
    }),
    enabled: Boolean(debouncedValue),
  });

  const options = items?.map((item) => ({
    id: item.id,
    name: item.display_name,
    data: item,
    component: () => {
      return (
        <FileViewer
          mimeType={item.content_type}
          url={`/api/proxy?filePath=vault/${item?.file_path?.join("/")}`}
        />
      );
    },
  }));

  return (
    <Combobox
      className="border border-border p-2 pl-10"
      placeholder={placeholder}
      onValueChange={(query) => {
        setValue(query);
      }}
      onSelect={onSelect}
      options={isLoading ? [] : options}
      isLoading={isLoading}
      classNameList="mt-2"
    />
  );
}
