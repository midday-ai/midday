"use client";

import { useTRPC } from "@/trpc/client";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { useQuery } from "@tanstack/react-query";

type Props = {
  onSelect: (id: string) => void;
  onCreate?: (name: string) => void;
  onEdit?: (id: string) => void;
  selectedId?: string;
};

export function SearchMerchants({
  onCreate,
  onSelect,
  onEdit,
  selectedId,
}: Props) {
  const trpc = useTRPC();

  const { data: merchants } = useQuery(
    trpc.merchants.get.queryOptions({
      pageSize: 100,
    }),
  );

  const formattedData = merchants?.data?.map((merchant) => ({
    id: merchant.id,
    label: merchant.name,
  }));

  const selectedItem = selectedId
    ? formattedData?.find((item) => item.id === selectedId)
    : undefined;

  return (
    <ComboboxDropdown
      placeholder="Select merchant"
      searchPlaceholder="Search merchant"
      className="text-xs"
      items={formattedData ?? []}
      onSelect={({ id }) => onSelect(id)}
      selectedItem={selectedItem}
      onCreate={(name) => {
        onCreate?.(name);
      }}
      renderListItem={(item) => {
        return (
          <div className="flex items-center justify-between w-full group">
            <span>{item.item.label}</span>
            <button
              type="button"
              onClick={() => onEdit?.(item.item.id)}
              className="text-xs opacity-0 group-hover:opacity-50 hover:opacity-100"
            >
              Edit
            </button>
          </div>
        );
      }}
      renderOnCreate={(name) => {
        return (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onCreate?.(name)}
            >{`Create "${name}"`}</button>
          </div>
        );
      }}
    />
  );
}
