"use client";

import { useMerchantParams } from "@/hooks/use-merchant-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
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
import React from "react";

export function SelectMerchant() {
  const trpc = useTRPC();
  const { setParams: setMerchantParams } = useMerchantParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const { data: merchants } = useQuery(
    trpc.merchants.get.queryOptions({
      pageSize: 100,
    }),
  );

  const formatData = merchants?.data?.map((item) => ({
    value: item.name,
    label: item.name,
    id: item.id,
  }));

  const handleSelect = (id: string) => {
    if (id === "create-merchant") {
      setMerchantParams({ createMerchant: true, name: value });
    } else {
      setInvoiceParams({ selectedMerchantId: id });
    }

    setOpen(false);
  };

  if (!merchants?.data?.length) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => setMerchantParams({ createMerchant: true })}
        className="text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
      >
        Select merchant
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          className="text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
        >
          Select merchant
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[200px] p-0"
        side="bottom"
        sideOffset={10}
        align="start"
      >
        <Command>
          <CommandInput
            value={value}
            onValueChange={setValue}
            placeholder="Search merchant..."
            className="p-2 text-xs"
          />
          <CommandList className="max-h-[180px] overflow-auto">
            <CommandEmpty className="text-xs border-t-[1px] border-border p-2">
              <button
                type="button"
                onClick={() =>
                  setMerchantParams({ createMerchant: true, name: value })
                }
              >
                Add merchant
              </button>
            </CommandEmpty>
            <CommandGroup>
              {formatData?.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.value}
                  onSelect={() => handleSelect(item.id)}
                  className="group text-xs"
                >
                  {item.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMerchantParams({ merchantId: item.id });
                    }}
                    className="ml-auto text-xs opacity-0 group-hover:opacity-50 hover:opacity-100"
                  >
                    Edit
                  </button>
                </CommandItem>
              ))}
              <CommandItem
                value="create-merchant"
                onSelect={handleSelect}
                className="text-xs border-t-[1px] border-border pt-2 mt-2"
              >
                Add merchant
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
