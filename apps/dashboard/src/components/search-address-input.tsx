"use client";

import { cn } from "@midday/ui/cn";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Command as CommandPrimitive,
} from "@midday/ui/command";
import { useJsApiLoader } from "@react-google-maps/api";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import usePlacesAutoComplete, { getDetails } from "use-places-autocomplete";
import { useOnClickOutside } from "usehooks-ts";

type Libraries = Parameters<typeof useJsApiLoader>[0]["libraries"];
const libraries: Libraries = ["places"];

type Props = {
  id?: string;
  defaultValue?: string;
  onSelect: (addressDetails: AddressDetails) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
};

export type AddressDetails = {
  address_line_1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  country_code: string;
};

type Option = {
  value: string;
  label: string;
};

const getAddressDetailsByAddressId = async (
  addressId: string,
): Promise<AddressDetails> => {
  const details = (await getDetails({
    placeId: addressId,
    fields: ["address_component"],
  })) as google.maps.places.PlaceResult;

  const comps = details.address_components;

  const streetNumber =
    comps?.find((c) => c.types.includes("street_number"))?.long_name ?? "";
  const streetAddress =
    comps?.find((c) => c.types.includes("route"))?.long_name ?? "";
  const city =
    comps?.find((c) => c.types.includes("postal_town"))?.long_name ||
    comps?.find((c) => c.types.includes("locality"))?.long_name ||
    comps?.find((c) => c.types.includes("sublocality_level_1"))?.long_name ||
    "";
  const state =
    comps?.find((c) => c.types.includes("administrative_area_level_1"))
      ?.short_name || "";
  const zip =
    comps?.find((c) => c.types.includes("postal_code"))?.long_name || "";
  const country =
    comps?.find((c) => c.types.includes("country"))?.long_name || "";
  const countryCode =
    comps?.find((c) => c.types.includes("country"))?.short_name || "";

  return {
    address_line_1: `${streetNumber} ${streetAddress}`.trim(),
    city,
    state,
    zip,
    country,
    country_code: countryCode,
  };
};

export function SearchAddressInput({
  onSelect,
  placeholder,
  defaultValue,
  disabled = false,
  emptyMessage = "No results found.",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option | null>(null);
  const [inputValue, setInputValue] = useState<string>(defaultValue || "");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries,
  });

  const {
    ready,
    suggestions: { status, data },
    setValue,
  } = usePlacesAutoComplete({
    initOnMount: isLoaded,
    debounce: 300,
    requestOptions: {
      language: "en",
    },
  });

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue, false);
      setInputValue(defaultValue);
    }
  }, [defaultValue, setValue]);

  const options: Option[] = data.map((item) => ({
    value: item.place_id,
    label: item.description,
  }));

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;

      if (!input) {
        return;
      }

      if (!isOpen) {
        setOpen(true);
      }

      if (event.key === "Enter" && input.value !== "") {
        const optionToSelect = options.find(
          (option) => option.label === input.value,
        );
        if (optionToSelect) {
          setSelected(optionToSelect);
          handleSelect(optionToSelect);
        }
      }

      if (event.key === "Escape") {
        input.blur();
      }
    },
    [isOpen, options],
  );

  const handleBlur = useCallback(() => {
    setInputValue(selected?.label || "");
  }, [selected]);

  const handleSelectOption = useCallback(
    (selectedOption: Option) => {
      setInputValue(selectedOption.label);
      setSelected(selectedOption);
      handleSelect(selectedOption);
      setOpen(false);

      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    },
    [onSelect],
  );

  const handleSelect = async (address: Option) => {
    setValue(address.label, false);
    const addressDetails = await getAddressDetailsByAddressId(address.value);

    onSelect(addressDetails);
  };

  // @ts-expect-error
  useOnClickOutside(ref, () => {
    setOpen(false);
  });

  return (
    <div ref={ref} className="relative">
      <CommandPrimitive onKeyDown={handleKeyDown}>
        <div className="relative">
          <CommandInput
            ref={inputRef}
            value={inputValue}
            onValueChange={(value) => {
              setInputValue(value);
              setValue(value);
              setOpen(true);
            }}
            onBlur={handleBlur}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled || !ready}
            className="border border-border px-3 py-1 text-sm h-9"
            autoComplete="off"
          />
        </div>

        {isOpen && (
          <CommandList className="absolute top-full left-0 right-0 z-10 mt-1 bg-background">
            {options.length > 0 ? (
              <CommandGroup className="border border-border max-h-[165px] overflow-auto">
                {options.map((option) => {
                  const isSelected = selected?.value === option.value;

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onSelect={() => handleSelectOption(option)}
                      className={cn(
                        "flex w-full items-center gap-2",
                        !isSelected ? "pl-8" : null,
                      )}
                    >
                      {option.label}
                      {isSelected ? <Check className="w-4" /> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
            {inputValue &&
            options.length === 0 &&
            !selected &&
            status === "ZERO_RESULTS" ? (
              <CommandEmpty className="select-none px-2 py-3 text-center text-sm">
                {emptyMessage}
              </CommandEmpty>
            ) : null}
          </CommandList>
        )}
      </CommandPrimitive>
    </div>
  );
}
