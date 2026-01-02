"use client";

import {
  invoiceFilterOutputSchema,
  invoiceFilterSchema,
} from "@/app/api/ai/filters/invoices/schema";
import type { InvoiceFilterSchema } from "@/app/api/ai/filters/invoices/schema";
import {
  mapStringArrayToIds,
  normalizeString,
  useAIFilter,
  validateEnumArray,
} from "@/hooks/use-ai-filter";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Calendar } from "@midday/ui/calendar";
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
import { formatISO } from "date-fns";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
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

  const mapInvoiceFilters = useCallback(
    (
      object: InvoiceFilterSchema,
      data?: { customersData?: { data?: Array<{ id: string; name: string }> } },
    ) => {
      const statuses = Array.isArray(object.statuses)
        ? validateEnumArray(object.statuses, [
            "draft",
            "overdue",
            "paid",
            "unpaid",
            "canceled",
            "refunded",
          ] as const)
        : normalizeString(object.statuses)
          ? validateEnumArray([object.statuses], [
              "draft",
              "overdue",
              "paid",
              "unpaid",
              "canceled",
              "refunded",
            ] as const)
          : null;

      const customerIds = mapStringArrayToIds(
        object.customers,
        (name) =>
          data?.customersData?.data?.find((customer) => customer.name === name)
            ?.id ?? null,
      );

      return {
        q: normalizeString(object.name),
        statuses,
        customers: customerIds,
        start: normalizeString(object.start),
        end: normalizeString(object.end),
      };
    },
    [],
  );

  const { submit, isLoading } = useAIFilter({
    api: "/api/ai/filters/invoices",
    inputSchema: invoiceFilterSchema,
    outputSchema: invoiceFilterOutputSchema,
    mapper: mapInvoiceFilters,
    onFilterApplied: setFilter,
    data: { customersData },
  });

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (input.split(" ").length > 1) {
      const context = `Invoice payment statuses: ${statusFilters.map((filter) => filter.name).join(", ")}
         Customers: ${customersData?.data?.map((customer) => customer.name).join(", ")}
      `;

      submit({
        input,
        context,
        currentDate: formatISO(new Date(), { representation: "date" }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } else {
      setFilter({ q: input.length > 0 ? input : null });
    }
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
            placeholder="Search or filter"
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
          loading={isLoading}
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
                <Calendar
                  mode="range"
                  initialFocus
                  selected={{
                    from: filter?.start ? new Date(filter.start) : undefined,
                    to: filter?.end ? new Date(filter.end) : undefined,
                  }}
                  onSelect={(range) => {
                    setFilter({
                      start: range?.from
                        ? formatISO(range.from, { representation: "date" })
                        : null,
                      end: range?.to
                        ? formatISO(range.to, { representation: "date" })
                        : null,
                    });
                  }}
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
                className="p-0"
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
