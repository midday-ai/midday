"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "../utils";
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Icons } from "./icons";

export type Option = Record<"id" | "name", string> & Record<string, string>;

type ComboboxProps = {
  options: Option[];
  emptyMessage: string;
  value?: Option;
  onSelect?: (value?: Option) => void;
  onCreate?: (value?: string) => void;
  onRemove?: () => void;
  onValueChange?: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  classNameList?: string;
  autoFocus?: boolean;
  showIcon?: boolean;
  CreateComponent?: React.ReactElement<{ value: string }>;
};

export const Combobox = ({
  options,
  placeholder,
  value,
  onSelect,
  onRemove,
  onCreate,
  disabled,
  className,
  classNameList,
  isLoading = false,
  showIcon = true,
  autoFocus,
  onValueChange,
  CreateComponent,
}: ComboboxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option | undefined>(value as Option);
  const [inputValue, setInputValue] = useState<string>(value?.name || "");

  const handleOnValueChange = (value: string) => {
    setInputValue(value);
    onValueChange?.(value);

    if (value) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleOnRemove = () => {
    setSelected(undefined);
    setInputValue("");
    onRemove?.();
  };

  const handleBlur = useCallback(() => {
    setOpen(false);
    setInputValue(selected?.name);
  }, [selected]);

  const handleOnFocus = () => {
    if (inputValue !== value?.name) {
      setOpen(true);
    }
  };

  const handleSelectOption = useCallback(
    (selectedOption: Option) => {
      setInputValue(selectedOption.name);

      setSelected(selectedOption);
      onSelect?.(selectedOption);

      // This is a hack to prevent the input from being focused after the user selects an option
      // We can call this hack: "The next tick"
      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    },
    [onSelect],
  );

  return (
    <CommandPrimitive className="w-full">
      <div className="flex items-center w-full relative">
        {showIcon && (
          <Icons.Search className="w-[18px] h-[18px] absolute left-4 pointer-events-none" />
        )}

        <CommandInput
          ref={inputRef}
          value={inputValue}
          onValueChange={handleOnValueChange}
          onBlur={handleBlur}
          onFocus={handleOnFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          autoFocus={autoFocus}
        />

        {isLoading && (
          <Loader2 className="w-[16px] h-[16px] absolute right-2 animate-spin text-dark-gray" />
        )}

        {!isLoading && selected && onRemove && (
          <Icons.Close
            className="w-[18px] h-[18px] absolute right-2"
            onClick={handleOnRemove}
          />
        )}
      </div>

      <div className="relative w-full">
        <CommandList
          className="w-full outline-none animate-in fade-in-0 zoom-in-95"
          hidden={!isOpen}
        >
          {inputValue?.length > 0 && (
            <CommandGroup
              className={cn(
                "bg-background absolute z-10 w-full max-h-[250px] overflow-auto py-2 border px-2",
                classNameList,
              )}
            >
              {options?.map(({ component: Component, ...option }) => {
                return (
                  <CommandItem
                    key={option.id}
                    value={`${option.name}_${option.id}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onSelect={() => handleSelectOption(option)}
                    className="flex items-center gap-2 w-full px-2"
                  >
                    {Component ? <Component /> : option.name}
                  </CommandItem>
                );
              })}

              {onCreate &&
                !options?.find(
                  (o) => o.name.toLowerCase() === inputValue.toLowerCase(),
                ) && (
                  <CommandItem
                    key={inputValue}
                    value={inputValue}
                    onSelect={() => onCreate(inputValue)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    {CreateComponent ? (
                      <CreateComponent value={inputValue} />
                    ) : (
                      `Create "${inputValue}"`
                    )}
                  </CommandItem>
                )}
            </CommandGroup>
          )}
        </CommandList>
      </div>
    </CommandPrimitive>
  );
};
