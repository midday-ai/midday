"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { cn } from "../utils";
import { Button } from "./button";

const monthsNumber = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export type DateRange = {
  from?: Date | null;
  to?: Date | null;
};

type Props = React.HTMLAttributes<HTMLDivElement> & {
  date?: DateRange;
  setDate: (range?: DateRange) => void;
};

export const MonthRangePicker = ({ date, setDate }: Props) => {
  const [yearOffset, setYearOffset] = useState<number>(0);

  const today = new Date();

  const isMonthSelected = (month: Date) => {
    if (!date?.from || !date?.to) {
      return false;
    }
    const startYearMonth =
      date?.from.getFullYear() * 12 + date?.from.getMonth();
    const endYearMonth = date?.to.getFullYear() * 12 + date?.to.getMonth();
    const currentYearMonth = month.getFullYear() * 12 + month.getMonth();

    return (
      currentYearMonth >= startYearMonth && currentYearMonth <= endYearMonth
    );
  };

  const isMonthStart = (month: Date) => {
    return month.getTime() === (date?.from?.getTime() || 0);
  };

  const isMonthEnd = (month: Date) => {
    if (!date?.to) {
      return false;
    }

    const endYearMonth = date?.to.getFullYear() * 12 + date?.to.getMonth();
    const currentYearMonth = month.getFullYear() * 12 + month.getMonth();

    return currentYearMonth === endYearMonth;
  };

  const handleMonthClick = (month: Date) => {
    if (!date?.from || date?.to) {
      setDate({ from: month, to: null });
    } else if (month < date?.from) {
      setDate({ from: month, to: date?.from });
    } else {
      setDate({ to: month });
    }
  };

  const renderMonth = (year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const isSelected = isMonthSelected(monthStart);
    const isStart = isMonthStart(monthStart);
    const isEnd = isMonthEnd(monthStart);

    const isSelectedDate = isStart || isEnd;
    const isRange = isSelected && !isSelectedDate;

    return (
      <Button
        key={month}
        variant="ghost"
        className={cn(
          "text-xs rounded-xl",
          isSelectedDate &&
            "bg-black text-white hover:bg-black hover:text-white",
          isRange && "bg-accent-pale",
        )}
        onClick={() => handleMonthClick(monthStart)}
      >
        {new Intl.DateTimeFormat("en-US", { month: "short" }).format(
          monthStart,
        )}
      </Button>
    );
  };

  const renderYear = (year: number) =>
    monthsNumber.map((month) => renderMonth(year, month));

  return (
    <>
      <div className="flex justify-between py-2 mt-2">
        <Button
          onClick={() => setYearOffset(yearOffset - 1)}
          variant="ghost"
          size="icon"
        >
          <ChevronLeft className="w-[18px]" />
        </Button>

        <Button
          onClick={() => setYearOffset(yearOffset + 1)}
          variant="ghost"
          size="icon"
        >
          <ChevronRight className="w-[18px]" />
        </Button>
      </div>

      <div className="-mt-10 text-center flex justify-between">
        <p className="ml-[76px] text-sm">{today.getFullYear() + yearOffset}</p>
        <p className="mr-[78px] text-sm">
          {today.getFullYear() + yearOffset + 1}
        </p>
      </div>

      <div className="flex mt-4 justify-between">
        <div className="grid grid-cols-3 w-[47%]">
          {renderYear(today.getFullYear() + yearOffset)}
        </div>
        <div className="grid grid-cols-3 w-[47%]">
          {renderYear(today.getFullYear() + yearOffset + 1)}
        </div>
      </div>
    </>
  );
};
