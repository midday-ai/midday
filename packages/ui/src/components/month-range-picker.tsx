"use client";

import { endOfMonth, formatISO, isSameDay, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { cn } from "../utils";
import { Button } from "./button";

const monthsNumber = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export type DateRange = {
  from?: string | null;
  to?: string | null;
};

type Props = React.HTMLAttributes<HTMLDivElement> & {
  date?: DateRange;
  setDate: (range?: DateRange) => void;
};

export const MonthRangePicker = ({ date, setDate }: Props) => {
  const [yearOffset, setYearOffset] = useState<number>(0);

  const today = new Date();
  const fromDate = date?.from ? new Date(date.from) : null;
  const toDate = date?.to ? new Date(date.to) : null;

  const isMonthSelected = (month: Date) => {
    if (!fromDate || !toDate) {
      return false;
    }

    const startYearMonth = fromDate.getFullYear() * 12 + fromDate.getMonth();
    const endYearMonth = toDate.getFullYear() * 12 + toDate.getMonth();
    const currentYearMonth = month.getFullYear() * 12 + month.getMonth();

    return (
      currentYearMonth >= startYearMonth && currentYearMonth <= endYearMonth
    );
  };

  const isMonthStart = (month: Date) => {
    if (!fromDate) {
      return false;
    }

    const startYearMonth = fromDate.getFullYear() * 12 + fromDate.getMonth();
    const currentYearMonth = month.getFullYear() * 12 + month.getMonth();

    return currentYearMonth === startYearMonth;
  };

  const isMonthEnd = (month: Date) => {
    if (!toDate) {
      return false;
    }

    const endYearMonth = toDate.getFullYear() * 12 + toDate.getMonth();
    const currentYearMonth = month.getFullYear() * 12 + month.getMonth();

    return currentYearMonth === endYearMonth;
  };

  const handleMonthClick = (selectedDate: Date) => {
    if (toDate && isSameDay(endOfMonth(selectedDate), toDate)) {
      setDate({
        from: null,
        to: null,
      });

      return;
    }

    if (!date?.from || date?.to) {
      setDate({
        from: formatISO(startOfMonth(new Date(selectedDate)), {
          representation: "date",
        }),
        to: null,
      });
    } else if (fromDate && selectedDate < fromDate) {
      setDate({
        from: formatISO(startOfMonth(new Date(selectedDate)), {
          representation: "date",
        }),
        to: date?.from
          ? formatISO(endOfMonth(new Date(date.from)), {
              representation: "date",
            })
          : null,
      });
    } else {
      setDate({
        to: formatISO(endOfMonth(new Date(selectedDate)), {
          representation: "date",
        }),
      });
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
      <button
        type="button"
        key={month}
        className={cn(
          "!w-[40px] !h-[40px] m-0 pr-[60px] rounded-none mb-1.5 bg-transparent",
          isStart && toDate && "bg-secondary rounded-l-full",
          isEnd && "bg-secondary rounded-r-full pr-0",
          isRange && "bg-secondary"
        )}
        onClick={() => handleMonthClick(monthStart)}
      >
        <div
          className={cn(
            "flex items-center justify-center !w-[40px] !h-[40px] !text-xs font-medium hover:rounded-full border border-transparent hover:border-primary",
            isSelectedDate && "bg-primary text-primary-foreground",
            isSelectedDate &&
              "rounded-full hover:bg-primary hover:text-primary-foreground",

            isStart && "",
            isEnd && ""
          )}
        >
          <span>
            {new Intl.DateTimeFormat("en-US", { month: "short" }).format(
              monthStart
            )}
          </span>
        </div>
      </button>
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
        <div className="grid grid-cols-3">
          {renderYear(today.getFullYear() + yearOffset)}
        </div>
        <div className="grid grid-cols-3">
          {renderYear(today.getFullYear() + yearOffset + 1)}
        </div>
      </div>
    </>
  );
};
