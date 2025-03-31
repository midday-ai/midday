import { useTRPC } from "@/trpc/client";
import { getColorFromName } from "@/utils/categories";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { Spinner } from "@midday/ui/spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CategoryColor } from "./category";

type Selected = {
  id: string;
  name: string;
  color: string | null;
  slug: string;
};

type Props = {
  selected?: Selected;
  onChange: (selected: Selected) => void;
  headless?: boolean;
  hideLoading?: boolean;
};

function transformCategory(category: {
  id: string;
  name: string;
  color: string | null;
  slug: string;
  description: string | null;
  system: boolean | null;
  vat: number | null;
}) {
  return {
    id: category.id,
    label: category.name,
    color: category.color ?? getColorFromName(category.name),
    slug: category.slug,
  };
}

export function SelectCategory({
  selected,
  onChange,
  headless,
  hideLoading,
}: Props) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.transactionCategories.get.queryOptions(),
  );

  const categories = data?.map(transformCategory) ?? [];

  const createCategoryMutation = useMutation(
    trpc.transactionCategories.create.mutationOptions({
      onSuccess: (data) => {
        // onChange({
        //   id: data.id,
        //   name: data.name,
        //   color: data.color,
        //   slug: data.slug,
        // });
      },
    }),
  );

  const selectedValue = selected ? transformCategory(selected) : undefined;

  if (!selected && isLoading && !hideLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <ComboboxDropdown
      headless={headless}
      disabled={createCategoryMutation.isPending}
      placeholder="Select category"
      searchPlaceholder="Search category"
      items={categories}
      selectedItem={selectedValue}
      onSelect={(item) => {
        onChange({
          id: item.id,
          name: item.label,
          color: item.color,
          slug: item.slug,
        });
      }}
      {...(!headless && {
        onCreate: (value) => {
          createCategoryMutation.mutate({
            name: value,
            color: getColorFromName(value),
          });
        },
      })}
      renderSelectedItem={(selectedItem) => (
        <div className="flex items-center space-x-2">
          <CategoryColor color={selectedItem.color} />
          <span className="text-left truncate max-w-[90%]">
            {selectedItem.label}
          </span>
        </div>
      )}
      renderOnCreate={(value) => {
        if (!headless) {
          return (
            <div className="flex items-center space-x-2">
              <CategoryColor color={getColorFromName(value)} />
              <span>{`Create "${value}"`}</span>
            </div>
          );
        }
      }}
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
