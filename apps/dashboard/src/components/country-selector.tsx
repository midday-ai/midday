import countries from "@midday/location/src/country-flag";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@midday/ui/command";
import {
  Popover,
  PopoverContentWithoutPortal,
  PopoverTrigger,
} from "@midday/ui/popover";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

type Props = {
  defaultValue: string;
  onSelect: (countryCode: string) => void;
};

export function CountrySelector({ defaultValue, onSelect }: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);

  const selected = Object.values(countries).find(
    (country) => country.code === value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal truncate bg-accent"
        >
          {value ? selected?.name : "Select country"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContentWithoutPortal className="w-[225px] p-0">
        <Command>
          <CommandInput placeholder="Search country..." className="h-9 px-2" />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="overflow-y-auto max-h-[230px] pt-2">
            {Object.values(countries).map((country) => (
              <CommandItem
                key={country.code}
                value={country.name}
                onSelect={() => {
                  setValue(country.code);
                  onSelect?.(country.code);
                  setOpen(false);
                }}
              >
                {country.name}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === country.code ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContentWithoutPortal>
    </Popover>
  );
}
