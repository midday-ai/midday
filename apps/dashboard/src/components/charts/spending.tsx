"use client";

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

const data = [
  { name: "Group A", value: 400 },
  { name: "Group B", value: 300 },
  { name: "Group C", value: 300 },
  { name: "Group D", value: 200 },
];

const COLORS = ["#F5F5F3", "#FFD02B", "#00C969", "#0064D9"];

const ToolTipContent = ({ payload = {} }) => {
  return (
    <div className="w-[240px] rounded-xl border shadow-sm bg-background">
      <div className="border-b-[1px] px-4 py-2 flex justify-between items-center">
        <p className="text-sm">Revenue</p>
        <div>
          <div className="flex space-x-1 text-[#00C969] items-center">
            <span className="text-[12px] font-medium">24%</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#F5F5F3]" />
            <p className="font-medium text-[13px]">€20345.50</p>
          </div>

          <p className="text-xs text-[#606060] text-right">October 20, 2023</p>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#606060]" />
            <p className="font-medium text-[13px]">€20345.50</p>
          </div>

          <p className="text-xs text-[#606060] text-right">October 20, 2022</p>
        </div>
      </div>
    </div>
  );
};

export function Spending() {
  return (
    <div className="flex-1 border p-8">
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
                value="€ 32,240"
                position="center"
                fontSize={23}
                fill="#F5F5F3"
                fontFamily="var(--font-sans)"
              />

              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={ToolTipContent} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
