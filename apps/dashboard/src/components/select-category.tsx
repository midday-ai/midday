import { searchAction } from "@/actions/search-action";
import { useI18n } from "@/locales/client";
import { getColorFromName } from "@/utils/categories";
import { Combobox } from "@midday/ui/combobox";
import { useDebounce } from "@uidotdev/usehooks";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { CategoryColor, categories, mapCategoryColor } from "./category";

type Selected = {
  id: string;
  name: string;
  color?: string;
  system: boolean;
};

type Props = {
  selected?: Selected;
  isLoading: boolean;
  placeholder: string;
  onChange: (selected: Selected) => void;
};

export function SelectCategory({ selected, placeholder, onChange }: Props) {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const t = useI18n();

  console.log(selected);

  const debouncedSearchTerm = useDebounce(query, 50);

  const search = useAction(searchAction, {
    onSuccess: (response) => {
      setData(response);
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  useEffect(() => {
    setValue(selected?.name);
  }, [selected]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      search.execute({
        query: debouncedSearchTerm,
        type: "categories",
        limit: 10,
      });
    }
  }, [debouncedSearchTerm]);

  const defaultCategories = Object.keys(categories).map((category) => ({
    id: category,
    name: t(`categories.${category}`),
    color: mapCategoryColor(category),
  }));

  const options = [...defaultCategories, ...data]?.map((d) => ({
    id: d.id,
    name: d.name,
    component: () => {
      return (
        <div className="flex items-center space-x-2">
          <div
            className="rounded-[2px] size-3"
            style={{ backgroundColor: d.color }}
          />
          <span>{d.name}</span>
        </div>
      );
    },
  }));

  const onSelect = (blah) => {
    console.log(blah);
  };

  const selectedValue = selected
    ? {
        id: selected.id,
        name: selected.system ? t(`categories.${selected.id}`) : selected.name,
      }
    : undefined;

  return (
    <div className="relative">
      {selected && (
        <CategoryColor
          className="absolute top-[12px] left-2"
          system={selected.system}
          color={selected.color}
          name={selected.name}
        />
      )}

      <Combobox
        showIcon={false}
        className="border border-border rounded-md p-2 h-9 pl-7"
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
        onCreate={() => {}}
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
