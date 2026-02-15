"use client";

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
import { formatISO, parseISO } from "date-fns";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTrackerFilterParams } from "@/hooks/use-tracker-filter-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { FilterList } from "./filter-list";

const statusFilters = [
  { id: "in_progress", name: "In Progress" },
  { id: "completed", name: "Completed" },
];

export function TrackerSearchFilter() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const trpc = useTRPC();
  const { data: user } = useUserQuery();

  const { filter, setFilter } = useTrackerFilterParams();

  const shouldFetch = isOpen;

  const { data: customersData } = useQuery({
    ...trpc.customers.get.queryOptions(),
    enabled: shouldFetch || Boolean(filter.customers?.length),
  });

  const { data: membersData } = useQuery({
    ...trpc.team.members.queryOptions(),
    enabled: shouldFetch || Boolean(filter.customers?.length),
  });

  const { data: tagsData } = useQuery({
    ...trpc.tags.get.queryOptions(),
    enabled: shouldFetch || Boolean(filter.tags?.length),
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
      enabled: Boolean(input) && isFocused,
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

  const members = membersData?.map((member) => ({
    id: member.user!.id as string,
    name: member.user!.fullName as string,
  }));

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex space-x-4 items-center">
        <FilterList
          filters={validFilters}
          onRemove={setFilter}
          members={members}
          customers={customersData?.data}
          statusFilters={statusFilters}
          tags={tagsData}
        />

        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder="Search projects..."
            className="pl-9 w-full md:w-[350px] pr-8"
            value={input}
            onChange={handleSearch}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        align="end"
        sideOffset={19}
        alignOffset={-11}
        side="bottom"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CalendarMonth className="mr-2 h-4 w-4" />
              <span>Date</span>
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
                  weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                  toDate={new Date()}
                  selected={
                    filter.start || filter.end
                      ? {
                          from: filter.start
                            ? parseISO(filter.start)
                            : undefined,
                          to: filter.end ? parseISO(filter.end) : undefined,
                        }
                      : undefined
                  }
                  onSelect={(range) => {
                    if (!range) return;

                    const newRange = {
                      start: range.from
                        ? formatISO(range.from, { representation: "date" })
                        : filter.start,
                      end: range.to
                        ? formatISO(range.to, { representation: "date" })
                        : filter.end,
                    };

                    setFilter(newRange);
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.ProjectStatus className="mr-2 h-4 w-4 rotate-180" />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {statusFilters.map(({ id, name }) => (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={filter?.status === id}
                    onCheckedChange={() => {
                      setFilter({
                        status: id as "completed" | "in_progress" | null,
                      });
                    }}
                  >
                    {name}
                  </DropdownMenuCheckboxItem>
                ))}
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
              <span>Tags</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {tagsData?.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    onCheckedChange={() => {
                      setFilter({
                        tags: filter?.tags?.includes(tag.id)
                          ? filter.tags.filter((s) => s !== tag.id)
                          : [...(filter?.tags ?? []), tag.id],
                      });
                    }}
                  >
                    {tag.name}
                  </DropdownMenuCheckboxItem>
                ))}

                {!tagsData?.length && (
                  <DropdownMenuItem disabled>No tags found</DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
