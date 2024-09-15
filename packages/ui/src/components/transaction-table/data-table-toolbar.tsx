"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "../button"
import { Input } from "../input"


import { BriefcaseIcon, CalendarIcon } from "@heroicons/react/24/outline"
import { Transaction } from "client-typescript-sdk"
import { addDays, format } from "date-fns"
import React from "react"
import { DateRange } from "react-day-picker"
import { cn } from "../../utils/cn"
import { Calendar } from "../calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-options"


interface DataTableToolbarProps<TData> {
  table: Table<TData>
  transactions: Array<Transaction>
}

export function DataTableToolbar<TData>({
  table,
  transactions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // get all personal finance categories from the transactions
  const personalFinanceCategories = transactions.map((data) => {
    return {
      label: data.personalFinanceCategoryPrimary ?? '',
      value: data.personalFinanceCategoryPrimary ?? '',
      icon: BriefcaseIcon,
    }
  })

  // Remove duplicates based on the `value` property
  const uniquePersonalFinanceCategories = personalFinanceCategories.filter((category, index, self) =>
    index === self.findIndex((c) => c.value === category.value)
  );


  // get all merchant names from the transactions
  const merchantNames = transactions.map((data) => {
    return {
      label: data.merchantName ?? '',
      value: data.merchantName ?? '',
      icon: BriefcaseIcon,
    };
  })

  // Remove duplicates based on the `value` property
  const uniqueMerchantNames = merchantNames.filter((merchant, index, self) =>
    index === self.findIndex((m) => m.value === merchant.value)
  );


  // get all the account ids from the transactions
  const accountIds = transactions.map((data) => {
    return {
      label: data.accountId ?? '',
      value: data.accountId ?? '',
      icon: BriefcaseIcon,
    }
  })


  // Remove duplicates based on the `value` property
  const uniqueAccountIds = accountIds.filter((account, index, self) =>
    index === self.findIndex((a) => a.value === account.value)
  );

  const paymentChannels = transactions.map((data) => {
    return {
      label: data.paymentChannel ?? '',
      value: data.paymentChannel ?? '',
      icon: BriefcaseIcon,
    }
  });


  // Remove duplicates based on the `value` property
  const uniquePaymentChannels = paymentChannels.filter((paymentChannel, index, self) =>
    index === self.findIndex((p) => p.value === paymentChannel.value)
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter transactions..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("personalFinanceCategoryPrimary") && (
          <DataTableFacetedFilter
            column={table.getColumn("personalFinanceCategoryPrimary")}
            title="Personal Finance Category"
            options={uniquePersonalFinanceCategories}
          />
        )}
        {table.getColumn("merchantName") && (
          <DataTableFacetedFilter
            column={table.getColumn("merchantName")}
            title="Merchant Name"
            options={uniqueMerchantNames}
          />
        )}
        {table.getColumn("accountId") && (
          <DataTableFacetedFilter
            column={table.getColumn("accountId")}
            title="Account"
            options={uniqueAccountIds}
          />
        )}
        {table.getColumn("paymentChannel") && (
          <DataTableFacetedFilter
            column={table.getColumn("paymentChannel")}
            title="Payment Channel"
            options={uniquePaymentChannels}
          />
        )}
        <CalendarDateRangePicker
          className="hidden lg:block"
          table={table}
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}

interface DataTableSearchProps<TData> {
  table: Table<TData>;
  className?: string;
}

export function CalendarDateRangePicker<TData>({
  className,
  table,
}: DataTableSearchProps<TData>) {
  const setSelectedDate = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    if (undefined !== selectedDate) {
      table
        .getColumn('authorizedDate')
        ?.setFilterValue(selectedDate.to);
    }
  };

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2023, 0, 20),
    to: addDays(new Date(2023, 0, 20), 20),
  });

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setSelectedDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
