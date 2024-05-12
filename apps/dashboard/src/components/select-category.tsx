import { createCategoriesAction } from "@/actions/create-categories-action";
import { searchAction } from "@/actions/search-action";
import { getColorFromName } from "@/utils/categories";
import { cn } from "@midday/ui/cn";
import { Combobox } from "@midday/ui/combobox";
import { useDebounce } from "@uidotdev/usehooks";
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
  isLoading: boolean;
  placeholder: string;
  onChange: (selected: Selected) => void;
};

export function SelectCategory({ selected, placeholder, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const createCategories = useAction(createCategoriesAction, {
    onSuccess: (data) => {
      const category = data.at(0);

      if (category) {
        setData((prev) => [category, ...prev]);
        onChange(category);
      }
    },
  });

  const debouncedSearchTerm = useDebounce(query, 50);

  const search = useAction(searchAction, {
    onSuccess: (response) => {
      setData(response);
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  useEffect(() => {
    if (debouncedSearchTerm) {
      search.execute({
        query: debouncedSearchTerm,
        type: "categories",
        limit: 10,
      });
    }
  }, [debouncedSearchTerm]);

  const options = data?.map((option) => ({
    id: option.id,
    name: option.name,
    data: option,
    component: () => {
      return (
        <div className="flex items-center space-x-2">
          <div
            className="rounded-[2px] size-3"
            style={{ backgroundColor: option.color }}
          />
          <span>{option.name}</span>
        </div>
      );
    },
  }));

  const onSelect = (option) => {
    onChange({
      id: option.id,
      name: option.name,
      color: option.data.color,
      slug: option.data.slug,
    });
  };

  const onCreate = (value: string) => {
    createCategories.execute({
      categories: [
        {
          name: value,
          color: getColorFromName(value),
        },
      ],
    });
  };

  const selectedValue = selected
    ? {
        id: selected.id,
        name: selected.name,
      }
    : undefined;

  return (
    <div className="relative">
      {selected && (
        <CategoryColor
          className="absolute top-[12px] left-2"
          color={selected.color}
        />
      )}

      <Combobox
        key={selected?.id}
        showIcon={false}
        className={cn(
          "border border-border rounded-md p-2 h-9",
          selectedValue && "pl-7"
        )}
        placeholder={placeholder}
        value={selectedValue}
        CreateComponent={({ value }) => (
          <div className="flex items-center space-x-2">
            <div
              className="rounded-[2px] size-3 transition-colors"
              style={{ backgroundColor: getColorFromName(value) }}
            />
            <span>{`Create "${value}"`}</span>
          </div>
        )}
        onCreate={onCreate}
        onValueChange={(q) => {
          if (q) {
            setLoading(true);
            setQuery(q);
          } else {
            setLoading(false);
          }
        }}
        onSelect={onSelect}
        options={options}
        isLoading={isLoading}
        classNameList="mt-2"
      />
    </div>
  );
}
