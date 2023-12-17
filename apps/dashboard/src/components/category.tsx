"use client";

import { useI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";

export const categories = {
  travel: "travel",
  office_supplies: "office_supplies",
  meals: "meals",
  software: "software",
  rent: "rent",
  income: "income",
  equipment: "equipment",
  transfer: "transfer",
  internet_and_telephone: "internet_and_telephone",
  facilities_expenses: "facilities_expenses",
  activity: "activity",
  uncategorized: "uncategorized",
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
    [categories.transfer]: "#FF902B",
    [categories.internet_and_telephone]: "#FF8976",
    [categories.facilities_expenses]: "#A8AABC",
    [categories.activity]: "#E5E926",
    [categories.uncategorized]: "#606060",
    [categories.taxes]: "#B39CD0",
    [categories.other]: "#F5F5F3",
  }[name];
};

export function CategoryIcon({ name, size = 18 }) {
  const color = mapCategoryColor(name);

  return {
    [categories.travel]: <Icons.FlightTakeoff style={{ color }} size={size} />,
    [categories.office_supplies]: <Icons.Desk style={{ color }} size={size} />,
    [categories.meals]: <Icons.FastFood style={{ color }} size={size} />,
    [categories.software]: <Icons.Save style={{ color }} size={size} />,
    [categories.rent]: <Icons.HomeWork style={{ color }} size={size} />,
    [categories.income]: <Icons.Payments style={{ color }} size={size} />,
    [categories.equipment]: <Icons.Devices style={{ color }} size={size} />,
    [categories.transfer]: (
      <Icons.AccountBalance style={{ color }} size={size} />
    ),
    [categories.other]: <Icons.Category style={{ color }} size={size} />,
    [categories.activity]: <Icons.Celebration style={{ color }} size={size} />,
    [categories.uncategorized]: (
      <Icons.Difference style={{ color }} size={size} />
    ),
    [categories.taxes]: <Icons.Apartment style={{ color }} size={size} />,
    [categories.internet_and_telephone]: (
      <Icons.Sensors style={{ color }} size={size} />
    ),
    [categories.facilities_expenses]: (
      <Icons.DynamicForm style={{ color }} size={size} />
    ),
  }[name];
}

export function Category({ name, className }) {
  const t = useI18n();

  return (
    <div className={cn("flex space-x-2 items-center", className)}>
      <CategoryIcon name={name} />
      {name && <p>{t(`categories.${name}`)}</p>}
    </div>
  );
}
