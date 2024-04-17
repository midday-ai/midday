"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/cn";

export const categories = {
  travel: "travel",
  office_supplies: "office_supplies",
  meals: "meals",
  software: "software",
  rent: "rent",
  income: "income",
  equipment: "equipment",
  salary: "salary",
  transfer: "transfer",
  internet_and_telephone: "internet_and_telephone",
  facilities_expenses: "facilities_expenses",
  activity: "activity",
  uncategorized: "uncategorized",
  fees: "fees",
  taxes: "taxes",
  other: "other",
};

export const mapCategoryColor = (name: string) => {
  return {
    [categories.travel]: "#ABDD1D",
    [categories.office_supplies]: "#BB4647",
    [categories.meals]: "#1ADBDB",
    [categories.software]: "#0064D9",
    [categories.rent]: "#A843CB",
    [categories.income]: "#00C969",
    [categories.equipment]: "#E9BE26",
    [categories.salary]: "#D3E500",
    [categories.transfer]: "#FF902B",
    [categories.internet_and_telephone]: "#FF8976",
    [categories.facilities_expenses]: "#A8AABC",
    [categories.activity]: "#E5E926",
    [categories.fees]: "#40B9FE",
    [categories.uncategorized]: "#606060",
    [categories.taxes]: "#B39CD0",
    [categories.other]: "hsl(var(--primary))",
  }[name];
};

type CategoryIconProps = {
  name: string;
  size?: number;
};

export function CategoryIcon({ name, size = 12 }: CategoryIconProps) {
  const color = mapCategoryColor(name);

  return (
    <div
      className="rounded-[2px]"
      style={{ backgroundColor: color, width: size, height: size }}
    />
  );
}

type Props = {
  name: string;
  className?: string;
};

export function Category({ name, className }: Props) {
  const t = useI18n();

  return (
    <div className={cn("flex space-x-2 items-center", className)}>
      <CategoryIcon name={name} />
      {name && <p>{t(`categories.${name}`)}</p>}
    </div>
  );
}
