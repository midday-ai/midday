import { createCategoriesAction } from "@/actions/create-categories-action";
import { getColorFromName } from "@/utils/categories";
import { createClient } from "@midday/supabase/client";
import {
  getCategoriesQuery,
  getCurrentUserTeamQuery,
} from "@midday/supabase/queries";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
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
};

function transformCategory(category) {
  return {
    id: category.id,
    label: category.name,
    color: category.color,
    slug: category.slug,
  };
}

export function SelectCategory({ selected, onChange }: Props) {
  const [data, setData] = useState([]);
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
          setData(response.data.map(transformCategory));
        }
      }
    }

    if (!data.length) {
      fetchData();
    }
  }, [data]);

  const createCategories = useAction(createCategoriesAction, {
    onSuccess: (data) => {
      const category = data.at(0);

      if (category) {
        setData((prev) => [transformCategory(category), ...prev]);
        onChange(category);
      }
    },
  });

  const selectedValue = selected ? transformCategory(selected) : undefined;

  return (
    <ComboboxDropdown
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
        createCategories.execute({
          categories: [
            {
              name: value,
              color: getColorFromName(value),
            },
          ],
        });
      }}
      renderSelectedItem={(selectedItem) => (
        <div className="flex items-center space-x-2">
          <CategoryColor color={selectedItem.color} />
          <span>{selectedItem.label}</span>
        </div>
      )}
      renderOnCreate={(value) => {
        return (
          <div className="flex items-center space-x-2">
            <CategoryColor color={getColorFromName(value)} />
            <span>{`Create "${value}"`}</span>
          </div>
        );
      }}
      renderListItem={({ item }) => {
        return (
          <div className="flex items-center space-x-2">
            <CategoryColor color={item.color} />
            <span>{item.label}</span>
          </div>
        );
      }}
    />
  );
}
