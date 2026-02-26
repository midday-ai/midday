"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Props = {
  selectedDealCode?: string;
  onSelect: (dealCode: string | null) => void;
};

export function DealPicker({ selectedDealCode, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();

  const { data: deals } = useQuery({
    ...trpc.deals.list.queryOptions({}),
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !selectedDealCode && "text-muted-foreground",
          )}
        >
          {selectedDealCode ? (
            <span className="font-mono text-sm">{selectedDealCode}</span>
          ) : (
            "Select deal..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search deals..." />
          <CommandList>
            <CommandEmpty>No deals found.</CommandEmpty>
            <CommandGroup>
              {selectedDealCode && (
                <CommandItem
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              )}
              {deals?.data?.map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`${deal.dealCode} ${deal.merchantName ?? ""}`}
                  onSelect={() => {
                    onSelect(deal.dealCode);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{deal.dealCode}</span>
                    {deal.merchantName && (
                      <span className="text-xs text-muted-foreground">
                        {deal.merchantName}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
