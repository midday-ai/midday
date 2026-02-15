"use client";

import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { DateRangeFilter } from "./date-range-filter";
import { FilterList } from "./filter-list";

const allowedStatuses = [
  "draft",
  "overdue",
  "paid",
  "unpaid",
  "canceled",
  "scheduled",
  "refunded",
];

export function InvoiceSearchFilter() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const trpc = useTRPC();

  const { setFilter, filter } = useInvoiceFilterParams();

  const { data: customersData } = useQuery(trpc.customers.get.queryOptions());

  const statusFilters = allowedStatuses.map((status) => ({
    id: status,
    // @ts-expect-error
    name: t(`invoice_status.${status}`),
  }));

  useHotkeys(
    "esc",
    () => {
      setInput("");
      setFilter(null);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
      enabled: Boolean(input),
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setInput(value);
    } else {
      setFilter(null);
      setInput("");
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setFilter({ q: input.length > 0 ? input : null });
  };

  const validFilters = Object.fromEntries(
    Object.entries(filter).filter(([key]) => key !== "q"),
  );

  const hasValidFilters = Object.values(validFilters).some(
    (value) => value !== null,
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 items-start sm:items-center w-full">
        <form
          className="relative w-full sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder="Search invoices..."
            className="pl-9 w-full sm:w-[350px] pr-8"
            value={input}
            onChange={handleSearch}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />

          <DropdownMenuTrigger asChild>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              type="button"
              className={cn(
                "absolute z-10 right-3 top-[10px] opacity-50 transition-opacity duration-300 hover:opacity-100",
                hasValidFilters && "opacity-100",
                isOpen && "opacity-100",
              )}
            >
              <Icons.Filter />
            </button>
          </DropdownMenuTrigger>
        </form>

        <FilterList
          filters={validFilters}
          onRemove={setFilter}
          statusFilters={statusFilters}
          customers={customersData?.data}
        />
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        sideOffset={19}
        alignOffset={-11}
        side="bottom"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CalendarMonth className="mr-2 h-4 w-4" />
              <span>Due Date</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                <DateRangeFilter
                  start={filter?.start}
                  end={filter?.end}
                  onSelect={setFilter}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Face className="mr-2 h-4 w-4" />
              <span>Customer</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0 max-h-[300px] overflow-auto"
              >
                {customersData?.data?.map((customer) => (
                  <DropdownMenuCheckboxItem
                    key={customer.id}
                    onCheckedChange={() => {
                      setFilter({
                        customers: filter?.customers?.includes(customer.id)
                          ? filter.customers.filter((s) => s !== customer.id)
                          : [...(filter?.customers ?? []), customer.id],
                      });
                    }}
                  >
                    {customer.name}
                  </DropdownMenuCheckboxItem>
                ))}

                {!customersData?.data?.length && (
                  <DropdownMenuItem disabled>
                    No customers found
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Status className="mr-2 h-4 w-4" />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {statusFilters?.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.id}
                    onCheckedChange={() => {
                      setFilter({
                        statuses: filter?.statuses?.includes(status.id)
                          ? filter.statuses.filter((s) => s !== status.id)
                          : [...(filter?.statuses ?? []), status.id],
                      });
                    }}
                  >
                    {status.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Repeat className="mr-2 h-4 w-4" />
              <span>Type</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                <DropdownMenuCheckboxItem
                  checked={filter?.recurring === true}
                  onCheckedChange={(checked) => {
                    setFilter({
                      recurring: checked ? true : null,
                    });
                  }}
                >
                  Recurring
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filter?.recurring === false}
                  onCheckedChange={(checked) => {
                    setFilter({
                      recurring: checked ? false : null,
                    });
                  }}
                >
                  One-time
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
