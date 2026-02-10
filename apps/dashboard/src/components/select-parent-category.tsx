import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { Spinner } from "@midday/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { getColorFromName } from "@/utils/categories";
import { CategoryColor } from "./category";

type Selected = {
  id: string;
  name: string;
  color: string | null;
  slug: string;
};

type Props = {
  parentId?: string | null;
  onChange: (selected: Selected | null) => void;
  excludeIds?: string[]; // Categories to exclude from selection (e.g., self and children)
  hideLoading?: boolean;
};

function transformCategory(category: {
  id: string;
  name: string;
  color: string | null;
  slug: string | null;
  description: string | null;
  system: boolean | null;
  taxRate: number | null;
  taxType: string | null;
  parentId: string | null;
  children?: any[];
}): {
  id: string;
  label: string;
  color: string;
  slug: string;
} {
  return {
    id: category.id,
    label: category.name,
    color: category.color || getColorFromName(category.name) || "#6B7280",
    slug: category.slug!,
  };
}

export function SelectParentCategory({
  parentId,
  onChange,
  excludeIds = [],
  hideLoading,
}: Props) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.transactionCategories.get.queryOptions(),
  );

  // Filter to only parent categories (no parentId) and exclude specified IDs
  const parentCategories =
    data
      ?.filter(
        (category) => !category.parentId && !excludeIds.includes(category.id),
      )
      .map(transformCategory) ?? [];

  // Find the selected parent category based on parentId
  const selectedParent = parentId
    ? data?.find((category) => category.id === parentId)
    : null;
  const selectedValue = selectedParent
    ? transformCategory(selectedParent)
    : undefined;

  if (!selectedParent && isLoading && !hideLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <ComboboxDropdown
      placeholder="Select parent category"
      searchPlaceholder="Search parent category"
      items={parentCategories}
      selectedItem={selectedValue}
      onSelect={(item) => {
        if (item.id === "none") {
          onChange(null);
        } else {
          onChange({
            id: item.id,
            name: item.label,
            color: item.color,
            slug: item.slug,
          });
        }
      }}
      renderSelectedItem={(selectedItem) => (
        <div className="flex items-center space-x-2">
          <CategoryColor color={selectedItem.color} />
          <span className="text-left truncate max-w-[90%] font-normal">
            {selectedItem.label}
          </span>
        </div>
      )}
      renderListItem={({ item }) => {
        return (
          <div className="flex items-center space-x-2">
            <CategoryColor color={item.color} />
            <span className="line-clamp-1">{item.label}</span>
          </div>
        );
      }}
    />
  );
}
