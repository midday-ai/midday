import { ReloadIcon } from "@radix-ui/react-icons";
import React from "react";
import { ResponsiveContainer } from "recharts";
import { Button } from "../../button";
import { CalendarDatePicker } from "../../calendar/index";

export interface BaseDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface ChartContainerProps<T extends BaseDataPoint> {
  data: T[];
  dataSet: T[];
  setDataSet: React.Dispatch<React.SetStateAction<T[]>>;
  height: number;
  earliestDate: Date;
  latestDate: Date;
  filterDataByDateRange: (range: { from: Date; to: Date }) => void;
  enableAssistantMode?: boolean;
  children: React.ReactElement;
  disabled?: boolean;
  DatePickerComponent?: React.ComponentType<{
    date: { from: Date; to: Date };
    onDateSelect: (range: { from: Date; to: Date }) => void;
  }>;
  AssistantComponent?: React.ComponentType<{ className?: string }>;
}

export function ChartContainer<T extends BaseDataPoint>({
  data,
  dataSet,
  setDataSet,
  height,
  earliestDate,
  latestDate,
  filterDataByDateRange,
  enableAssistantMode = false,
  children,
  disabled = false,
  DatePickerComponent,
  AssistantComponent,
}: ChartContainerProps<T>) {
  const disabledClassName = disabled ? "skeleton-box opacity-15" : "";

  return (
    <div className={`flex flex-col gap-2 w-full`}>
      <div className="flex items-center gap-2">
        <CalendarDatePicker
          date={{ from: earliestDate, to: latestDate }}
          onDateSelect={(range: { from: Date; to: Date }) => {
            filterDataByDateRange(range);
          }}
        />
        {dataSet.length !== data.length && (
          <Button className="rounded-full" onClick={() => setDataSet(data)}>
            <ReloadIcon />
          </Button>
        )}
      </div>
      <ResponsiveContainer
        width="100%"
        height={height}
        className={`flex flex-col gap-2 h-full rounded-2xl ${disabledClassName}`}
      >
        {children}
      </ResponsiveContainer>
      {enableAssistantMode && AssistantComponent && (
        <div className="relative flex items-center gap-2">
          <AssistantComponent className="relative my-[2%]" />
        </div>
      )}
    </div>
  );
}
