import { useI18n } from "@/locales/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Skeleton } from "@midday/ui/skeleton";
import { useEffect, useState } from "react";
import { CategoryIcon, categories } from "./category";

export function SelectCategory({
  selectedId,
  isLoading,
  placeholder,
  onChange,
}) {
  const [value, setValue] = useState();
  const t = useI18n();

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  const sortedCategories = Object.values(categories).sort((a, b) => {
    if (a === value) {
      return -1;
    }

    if (b === value) {
      return 1;
    }

    return a.localeCompare(b);
  });

  return (
    <div className="relative w-full">
      {isLoading ? (
        <div className="h-[36px] border rounded-md">
          <Skeleton className="h-[14px] w-[40%] rounded-sm absolute left-3 top-[39px]" />
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id="category"
            className="line-clamp-1 truncate"
            onKeyDown={(evt) => evt.preventDefault()}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="overflow-y-auto max-h-[350px]">
            {sortedCategories.map((category) => (
              <SelectItem key={category} value={category}>
                <div className="flex space-x-2 items-center">
                  <CategoryIcon name={category} />
                  <span>{t(`categories.${category}`)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
