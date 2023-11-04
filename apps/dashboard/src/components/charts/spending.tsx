"use client";

import { useI18n } from "@/locales/client";
import { formatAmount, getClientLocale } from "@/utils/format";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Category, CategoryIcon, mapCategoryColor } from "../category";

const data = [
  { category: "equipment", value: 2045, currency: "SEK" },
  { category: "rent", value: 3002, currency: "SEK" },
  { category: "travel", value: 522, currency: "SEK" },
  { category: "office_supplies", value: 632, currency: "SEK" },
  { category: "software", value: 633, currency: "SEK" },
  { category: "transfer", value: 763, currency: "SEK" },
  { category: "meals", value: 154, currency: "SEK" },
  { category: "other", value: 520, currency: "SEK" },
  { category: "uncategorized", value: 109, currency: "SEK" },
];

const ToolTipContent = ({ payload = [] }) => {
  const t = useI18n();
  const locale = getClientLocale();
  const item = payload.at(0)?.payload;

  return (
    <div className="rounded-xl border shadow-sm bg-background p-1">
      <div className="px-4 py-2 flex justify-between items-center space-x-12">
        <div className="text-sm font-medium flex items-center space-x-2">
          {item?.category && <CategoryIcon name={item.category} />}
          <p>
            {item?.value &&
              formatAmount({
                amount: item.value,
                currency: item.currency,
                locale,
              })}
          </p>
        </div>
        <p className="text-sm text-[#606060]">
          {item?.category && t(`categories.${item.category}`)}
        </p>
      </div>
    </div>
  );
};

function SpendingCategoryList({ categories }) {
  return (
    <ul className="absolute left-8 bottom-8 space-y-2">
      {categories.map(({ category }) => (
        <li key={category}>
          <Category
            key={category}
            name={category}
            className="text-sm text-[#606060] space-x-3"
          />
        </li>
      ))}
    </ul>
  );
}

export function Spending() {
  return (
    <div className="flex-1 border p-8 relative">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl">Spending</h2>

            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuCheckboxItem checked>
            This month
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Last month</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>This year</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Last year</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="h-[350px]">
        <SpendingCategoryList categories={data} />
        <ResponsiveContainer>
          <PieChart width={250} height={250}>
            <Pie
              stroke="none"
              isAnimationActive={false}
              data={data}
              innerRadius={210 / 2}
              outerRadius={250 / 2}
              fill="#8884d8"
              dataKey="value"
            >
              <Label
                value={formatAmount({
                  amount: 32240,
                  currency: "SEK",
                })}
                position="center"
                fontSize={23}
                fill="#F5F5F3"
                fontFamily="var(--font-sans)"
              />

              {data.map(({ category }, index) => (
                <Cell key={`cell-${index}`} fill={mapCategoryColor(category)} />
              ))}
            </Pie>
            <Tooltip content={ToolTipContent} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
