import { createCategoriesAction } from "@/actions/create-categories-action";
import { getColorFromName } from "@/utils/categories";
import { createClient } from "@midday/supabase/client";
import {
  getCategoriesQuery,
  getCurrentUserTeamQuery,
} from "@midday/supabase/queries";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { Spinner } from "@midday/ui/spinner";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { CategoryColor } from "./category";

type Selected = {
  id: string;
  name: string;
  color: string;
  slug: string;
};

type Props = {
  selected?: Selected;
  onChange: (selected: Selected) => void;
  headless?: boolean;
  hideLoading?: boolean;
};

function transformCategory(category) {
  return {
    id: category.id,
    label: category.name,
    color: category.color,
    slug: category.slug,
  };
}

export function SelectCategory({
  selected,
  onChange,
  headless,
  hideLoading,
}: Props) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: userData } = await getCurrentUserTeamQuery(supabase);

      if (userData?.team_id) {
        const response = await getCategoriesQuery(supabase, {
          teamId: userData.team_id,
          limit: 1000,
        });

        if (response.data) {
          setData([
            ...response.data.map(transformCategory),
            {
              id: "uncategorized",
              label: "Uncategorized",
              color: "#606060",
              slug: "uncategorized",
            },
          ]);
        }
      }

      setIsLoading(false);
    }

    if (!data.length) {
      fetchData();
    }
  }, [data]);

  const createCategories = useAction(createCategoriesAction, {
    onSuccess: ({ data }) => {
      const category = data?.at(0);

      if (category) {
        setData((prev) => [transformCategory(category), ...prev]);
        onChange(category);
      }
    },
  });

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
      disabled={createCategories.status === "executing"}
      placeholder="Select category"
      searchPlaceholder="Search category"
      items={data}
      selectedItem={selectedValue}
      onSelect={(item) => {
        onChange({
          id: item.id,
          name: item.label,
          color: item.color,
          slug: item.slug,
        });
      }}
      onCreate={(value) => {
        if (!headless) {
          createCategories.execute({
            categories: [
              {
                name: value,
                color: getColorFromName(value),
              },
            ],
          });
        }
      }}
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
