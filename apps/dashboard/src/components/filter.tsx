"use client";

import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Input } from "@midday/ui/input";
import { MonthRangePicker } from "@midday/ui/month-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { cn } from "@midday/ui/utils";
import * as Tabs from "@radix-ui/react-tabs";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Trash2, X } from "lucide-react";
import { useQueryState } from "next-usequerystate";
import { useEffect, useState } from "react";

export enum SectionType {
  date = "date",
  checkbox = "checkbox",
  search = "search",
}

type SelectedOption = {
  filter: string;
  value: string;
};

type Option = {
  id: string;
  label: string;
  from?: Date;
  to?: Date;
  description?: string;
  icon?: any;
};

type Section = {
  id: string;
  label: string;
  type: SectionType;
  options: Option[];
  storage?: string;
  placeholder?: string;
  icon?: any;
};

type Props = {
  sections: Section[];
};

export function Filter({ sections }: Props) {
  const [activeId, setActiveId] = useState(sections?.at(0)?.id as string);
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearch, setRecentSearch] = useState<string[]>([]);
  const [filters, setFilters] = useQueryState("filter", {
    defaultValue: [],
    shallow: false,
    serialize: (obj) => JSON.stringify(obj),
    parse: (query) => JSON.parse(query) as { foo: string; bar: number },
  });

  useEffect(() => {
    const storageKey = sections.find(
      (section) => section.id === activeId,
    )?.storage;
    const saved = storageKey && localStorage.getItem(storageKey);

    if (saved) {
      setRecentSearch(JSON.parse(saved));
    }
  }, [activeId]);

  // const toggleFilter = useCallback(
  //   (option: SelectedOption) => {
  //     const params = new URLSearchParams(searchParams);

  //     let query;

  //     const filter = option.filter.toLowerCase();
  //     const value = option.value.toLowerCase();
  //     const section = filters[filter];

  //     if (section?.includes(value)) {
  //       query = {
  //         ...filters,
  //         [filter]: section.filter((item: string) => item !== value),
  //       };
  //     } else {
  //       query = {
  //         ...filters,
  //         [filter]: [...(filters[filter] ?? []), value],
  //       };
  //     }

  //     params.set("filters", JSON.stringify(query));
  //     router.replace(`?${params.toString()}`);
  //   },
  //   [filters, searchParams],
  // );

  const handleDateChange = (activeId, range = {}) => {
    const prevRange = filters[activeId];

    if (range.from || range.to) {
      setFilters({
        [activeId]: { ...prevRange, ...range },
      });
    } else {
      setFilters(null);
    }
  };

  const handleDeleteFilter = (filter: string) => {
    // delete filters[filter];
    // setFilters(filters);
  };

  const handleOnSearch = (
    evt: React.KeyboardEvent<HTMLInputElement>,
    storage?: string,
  ) => {
    // const params = new URLSearchParams();

    if (evt.key === "Enter") {
      setOpen(false);
      if (storage) {
        handleRecentSearch(storage, query);
      }

      if (query) {
        // params.set(
        //   "filters",
        //   JSON.stringify({
        //     ...filters,
        //     ...(query && { search: query }),
        //   }),
        // );
      } else {
        // delete filters.search;
        // params.set("filters", JSON.stringify(filters));
      }

      // router.replace(`?${params.toString()}`);
    }
  };

  const handleSelectRecentSearch = (value: string) => {
    // const params = new URLSearchParams();
    setOpen(false);

    // params.set(
    //   "filters",
    //   JSON.stringify({
    //     ...filters,
    //     search: value,
    //   }),
    // );

    // router.replace(`?${params.toString()}`);
  };

  const handleOpenSection = (id?: string) => {
    setOpen(true);

    if (id) {
      setActiveId(id);
    }
  };

  const handleRecentSearch = (storage: string, value: string) => {
    if (!recentSearch.includes(value)) {
      const updated = [value, ...recentSearch].slice(0, 8);

      setRecentSearch(updated);
      localStorage.setItem(storage, JSON.stringify(updated));
    }
  };

  const deleteRecentSearch = (storage?: string) => {
    setRecentSearch([]);
    if (storage) {
      localStorage.removeItem(storage);
    }
  };

  const renderFilter = (section: Section) => {
    const filter = filters[section.id];

    switch (section.type) {
      case "date": {
        if (filter.from && filter.to) {
          return `${format(new Date(filter.from), "MMM d, yyyy")} - ${format(
            new Date(filter.to),
            "MMM d, yyyy",
          )}`;
        }

        return filter.from && format(new Date(filter.from), "MMM d, yyyy");
      }
      case "search": {
        return `Anything matching "${filter}"`;
      }

      default: {
        if (filter.length > 1) {
          return `${section.label} (${filter.length})`;
        }

        if (filter.length) {
          return section?.options?.find((o) => o.id === filter.at(0))?.label;
        }
      }
    }
  };

  return (
    <div className="flex space-x-2 items-center">
      <Popover open={isOpen} onOpenChange={setOpen} size>
        <PopoverTrigger asChild>
          <Button variant="outline" className="space-x-2">
            <span>Add filter</span>
            <ChevronDown size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[650px] min-h-[320px] rounded-xl mt-2.5 p-0 overflow-hidden"
          align="start"
        >
          <Tabs.Root
            defaultValue="date"
            className="flex flex-row divide-x-[1px]"
            onValueChange={setActiveId}
            value={activeId}
          >
            <Tabs.TabsList className="w-[220px] min-h-[340px] p-4 flex flex-col items-start">
              {sections?.map(({ id, label, icon: Icon }) => {
                const isActive = activeId === id;

                return (
                  <Tabs.TabsTrigger value={id} asChild key={id}>
                    <Button
                      className={cn(
                        "rounded-md w-[190px] items-center justify-start relative mb-1.5 group",
                        isActive && "bg-secondary",
                      )}
                      variant="ghost"
                    >
                      {Icon && <Icon size={16} />}
                      <p
                        className={cn(
                          "p-sm font-normal ml-2 text-primary",
                          isActive && "bg-secondary",
                        )}
                      >
                        {label}
                      </p>
                      <ChevronRight
                        size={16}
                        className={cn(
                          "absolute right-2 invisible group-hover:visible",
                          isActive && "visible",
                        )}
                      />
                    </Button>
                  </Tabs.TabsTrigger>
                );
              })}
            </Tabs.TabsList>

            {sections?.map((section) => {
              if (section.type === SectionType.date) {
                return (
                  <Tabs.TabsContent
                    value={section.id}
                    className="p-4 w-[480px]"
                    key={section.id}
                  >
                    <Select
                      onValueChange={(id) => {
                        const value = section?.options.find((o) => o.id === id);
                        handleDateChange(id, {
                          from: value?.from,
                          to: value?.to,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        {section.options.map((option) => {
                          return (
                            <SelectItem value={option.id} key={option.id}>
                              {option.label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <MonthRangePicker
                      setDate={(range) => handleDateChange(activeId, range)}
                      date={{
                        from: filters[activeId]?.from,
                        to: filters[activeId]?.to,
                      }}
                    />
                  </Tabs.TabsContent>
                );
              }

              if (section.type === SectionType.search) {
                return (
                  <Tabs.TabsContent
                    value={section.id}
                    className="p-4 w-[480px]"
                    key={section.id}
                  >
                    <Input
                      placeholder={section?.placeholder}
                      autoFocus
                      onKeyDown={(evt) => handleOnSearch(evt, section?.storage)}
                      onChange={(evt) => setQuery(evt.target.value)}
                      value={query}
                      defaultValue={filters.search}
                    />

                    <div>
                      <div className="flex justify-between items-center border-b-[1px] py-2 mt-2 h-[40px]">
                        <p className="text-xs font-medium text-dark-gray">
                          Recent
                        </p>
                        {recentSearch.length > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-auto h-auto rounded-full p-2"
                            onClick={() => deleteRecentSearch(section?.storage)}
                          >
                            <Trash2 size={14} className="stroke-dark-gray" />
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col space-y-3 mt-4">
                        {recentSearch?.map((recent) => (
                          <div className="flex space-x-2" key={recent}>
                            <Checkbox
                              id={recent}
                              onCheckedChange={() =>
                                handleSelectRecentSearch(recent)
                              }
                              checked={filters.search === recent}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={recent}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {recent}
                              </label>
                            </div>
                          </div>
                        ))}

                        {!recentSearch.length && (
                          <div className="flex items-center justify-center mt-20">
                            <p className="text-dark-gray text-sm">
                              No recent searches
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Tabs.TabsContent>
                );
              }

              if (section.type === SectionType.checkbox) {
                return (
                  <Tabs.TabsContent
                    value={section.id}
                    className="p-4 w-[480px] space-y-4"
                    key={section.id}
                  >
                    {sections
                      ?.filter(
                        (section) => section.type === SectionType.checkbox,
                      )
                      .find((section) => section.id === activeId)
                      ?.options?.map((option) => {
                        const isChecked = Boolean(
                          filters[activeId]?.includes(option.id.toLowerCase()),
                        );

                        return (
                          <div
                            className="items-top flex space-x-2"
                            key={option.id}
                          >
                            <Checkbox
                              id={option.id}
                              checked={isChecked}
                              onCheckedChange={() =>
                                toggleFilter({
                                  filter: activeId!,
                                  value: option.id,
                                })
                              }
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={option.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {option.label}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {option?.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </Tabs.TabsContent>
                );
              }
            })}
          </Tabs.Root>
        </PopoverContent>
      </Popover>

      {!Object.keys(filters).length && (
        <span className="pl-4 text-sm text-[#606060]">No filters applied</span>
      )}

      {Object.keys(filters).map((optionId) => {
        const section = sections.find((o) => o.id === optionId);

        return (
          <div className="flex space-x-2" key={optionId}>
            <Button variant="secondary" className="flex space-x-2 bg-secondary">
              <X size={14} onClick={() => handleDeleteFilter(optionId)} />
              <p onClick={() => handleOpenSection(section?.id)}>
                {section && renderFilter(section)}
              </p>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
