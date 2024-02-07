"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Command, CommandGroup, CommandItem, CommandList } from "./command";

export type ComboboxOption = {
  id: string;
  name: string;
  component?: React.ReactNode;
};

type Props = {
  placeholder?: string;
  options: ComboboxOption[];
  onSelect: (option: ComboboxOption) => void;
  onCreate?: (value: string) => void;
  onValueChange: (value: string) => void;
  onFocus?: () => void;
  value?: string;
  loading?: boolean;
  isSaving?: boolean;
  isFetching?: boolean;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  hidden?: boolean;
};

export const Combobox = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      placeholder,
      options,
      onSelect,
      onCreate,
      loading,
      isSaving, // On mutations
      isFetching, // On searches
      onValueChange,
      onFocus,
      value,
      defaultValue,
      disabled,
      autoFocus,
      className,
      hidden: initialHidden,
    },
    ref
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [hidden, setHidden] = useState(initialHidden);
    const showSpinner = isSaving || isFetching;

    useEffect(() => {
      setHidden(initialHidden);
    }, [initialHidden]);

    useEffect(() => {
      if (value && defaultValue !== value && !loading) {
        setHidden(false);
      } else {
        setHidden(true);
      }
    }, [value, defaultValue, loading]);

    useEffect(() => {
      const handleClickOutside = (evt: MouseEvent) => {
        if (
          parentRef.current &&
          !parentRef.current.contains(evt.target as Node)
        ) {
          setHidden(true);
        }
      };

      document.addEventListener("click", handleClickOutside, true);

      return () => {
        document.removeEventListener("click", handleClickOutside, true);
      };
    }, []);

    const handleOnSelect = (option: ComboboxOption) => {
      setHidden(true);
      onSelect(option);
    };

    const handleOnCreate = (value?: string) => {
      setHidden(true);

      if (value && onCreate) {
        onCreate(value);
      }
    };

    const handleFocus = () => {
      if (value && value !== defaultValue) {
        setHidden(false);
      }

      onFocus?.();
    };

    const handleKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === "Escape" || evt.key === "Tab") {
        setHidden(true);
      }
    };

    return (
      <div className="relative w-full" ref={parentRef}>
        <Command hidden className="bg-transparent">
          <div className="relative">
            <CommandPrimitive.Input
              ref={ref}
              autoFocus={autoFocus}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              value={value}
              onValueChange={onValueChange}
              onFocus={handleFocus}
              placeholder={placeholder}
              className={cn(
                "flex h-10 w-full rounded-md border border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground dark:placeholder:text-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                loading && "skeleton-line self-start block",
                className
              )}
            />

            {showSpinner && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin absolute right-3 top-3 text-dark-gray" />
            )}
          </div>

          <CommandList
            hidden={hidden}
            className="absolute z-50 bg-background w-full border rounded-md bottom-[44px] left-0 right-0"
          >
            <CommandGroup className="max-h-[145px] overflow-auto">
              {options?.map(({ component: Component, ...option }) => {
                return (
                  <CommandItem
                    key={option.id}
                    value={`${option.name}_${option.id}`}
                    onSelect={() => handleOnSelect(option)}
                  >
                    {Component ? <Component /> : option.name}
                  </CommandItem>
                );
              })}

              {onCreate && (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={() => handleOnCreate(value)}
                >
                  {`Create "${value}"`}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  }
);
