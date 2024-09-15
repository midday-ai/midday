"use client";

import { CommandLoading } from "cmdk";
import { RawResult } from "leaflet-geosearch/dist/providers/bingProvider.js";
import { SearchResult } from "leaflet-geosearch/dist/providers/provider.js";
import { Check, ChevronsUpDown } from "lucide-react";
import React from "react";
import { useSearchAddress } from "../../hooks/use-search-address";
import { cn } from "../../utils/cn";

import { Button } from "../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

/**
 * Props for the SearchAddress component.
 * @interface SearchAddressProps
 */
interface SearchAddressProps {
  /**
   * Callback function triggered when a location is selected.
   * @param {SearchResult<RawResult> | null} item - The selected location or null if selection is cleared.
   */
  onSelectLocation: (item: SearchResult<RawResult> | null) => void;
}

/**
 * SearchAddress component for searching and selecting addresses.
 *
 * This component provides an interface for users to search for addresses and select
 * a result from the search. It uses the leaflet-geosearch library for address lookup.
 *
 * @component
 * @example
 * ```tsx
 * import dynamic from "next/dynamic";
 *
 * const SearchAddress = dynamic(() => import("@/components/ui/search-address"), {
 *   ssr: false,
 * });
 *
 * // In your component:
 * <SearchAddress onSelectLocation={(location) => console.log(location)} />
 *
 * Using dynamic imports with SSR disabled helps avoid the
 * window is not defined error during server-side rendering.
 * ```
 */
const SearchAddress: React.FC<SearchAddressProps> = ({ onSelectLocation }) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const {
    query,
    results,
    loading,
    handleSearch,
    selectedItem,
    setSelectedItem,
  } = useSearchAddress();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-80 justify-between truncate"
        >
          <p className="truncate">
            {selectedItem
              ? `${selectedItem.label} (${selectedItem.raw.entityType})`
              : "Select place..."}
          </p>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-[3%]">
        <Command>
          <CommandInput
            placeholder="Search the place..."
            onValueChange={(value) => handleSearch(value)}
            className="w-full"
          />
          <CommandList>
            {loading ? (
              <CommandLoading>
                <CommandEmpty>Type to search</CommandEmpty>
              </CommandLoading>
            ) : Object.keys(results).length > 0 ? (
              Object.entries(results).map(([type, items]) => (
                <CommandGroup
                  key={type}
                  heading={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  {items.map((item, index) => (
                    <CommandItem
                      key={index}
                      value={item.label}
                      onSelect={(currentValue: string) => {
                        const item = results[type]?.find(
                          (item) => item.label === currentValue,
                        );
                        setValue(currentValue === value ? "" : currentValue);
                        setSelectedItem(item ?? null);
                        onSelectLocation(item ?? null);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.label ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchAddress;
