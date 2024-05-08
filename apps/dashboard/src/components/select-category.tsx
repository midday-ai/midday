import { useI18n } from "@/locales/client";
import { Combobox } from "@midday/ui/combobox";
import { useEffect, useState } from "react";
import { CategoryIcon, categories } from "./category";

type Props = {
  selectedId: string;
  isLoading: boolean;
  placeholder: string;
  onChange: (selectedId: string) => void;
};

export function SelectCategory({ selectedId, placeholder, onChange }: Props) {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState();
  const [isLoading, setLoading] = useState(false);
  const t = useI18n();

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  // const sortedCategories = Object.values(categories).sort((a, b) => {
  //   if (a === value) {
  //     return -1;
  //   }

  //   if (b === value) {
  //     return 1;
  //   }

  //   return a.localeCompare(b);
  // });

  const defaultCategories = Object.keys(categories).map((category) => ({
    id: category,
    name: t(`categories.${category}`),
  }));

  const options = [...defaultCategories];

  const onSelect = () => {};

  return (
    <Combobox
      showIcon={false}
      className="border border-border rounded-md p-2"
      placeholder={placeholder}
      value={value}
      onValueChange={(query) => {
        setLoading(true);
        setQuery(query);
      }}
      onSelect={onSelect}
      options={options}
      isLoading={isLoading}
      classNameList="mt-2"
    />
  );
}
