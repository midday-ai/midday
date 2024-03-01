"use client";

import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { cn } from "../utils/cn";
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Icons } from "./icons";

export type Option = Record<"value" | "label", string> & Record<string, string>;

type AutoCompleteProps = {
  options: Option[];
  emptyMessage: string;
  value?: Option;
  onSelect?: (value?: Option) => void;
  onRemove?: () => void;
  onValueChange?: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export const Combobox = ({
  options,
  placeholder,
  value,
  onSelect,
  onRemove,
  disabled,
  className,
  isLoading = false,
  onValueChange,
}: AutoCompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option | undefined>(value as Option);
  const [inputValue, setInputValue] = useState<string>(value?.label || "");

  const handleOnValueChange = (value: string) => {
    setInputValue(value);
    onValueChange?.(value);
  };

  const handleOnRemove = () => {
    setSelected(undefined);
    setInputValue("");
    onRemove?.();
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      // Keep the options displayed when the user is typing
      if (!isOpen && value?.label !== input.value) {
        setOpen(true);
      }

      // This is not a default behaviour of the <input /> field
      if (event.key === "Enter" && input.value !== "") {
        const optionToSelect = options.find(
          (option) => option.label === input.value
        );

        if (optionToSelect) {
          setSelected(optionToSelect);
          onSelect?.(optionToSelect);
        }
      }

      if (event.key === "Escape") {
        input.blur();
      }
    },
    [isOpen, options, onSelect]
  );

  const handleBlur = useCallback(() => {
    setOpen(false);
    setInputValue(selected?.label);
  }, [selected]);

  const handleSelectOption = useCallback(
    (selectedOption: Option) => {
      setInputValue(selectedOption.label);

      setSelected(selectedOption);
      onSelect?.(selectedOption);

      // This is a hack to prevent the input from being focused after the user selects an option
      // We can call this hack: "The next tick"
      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    },
    [onSelect]
  );

  return (
    <CommandPrimitive onKeyDown={handleKeyDown} className="w-full">
      <div className="flex items-center w-full relative">
        <Icons.Search className="w-[22px] h-[22px] absolute left-4 pointer-events-none" />

        <CommandInput
          ref={inputRef}
          value={inputValue}
          onValueChange={handleOnValueChange}
          onBlur={handleBlur}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
        {!isLoading && selected && (
          <Icons.Close
            className="w-[20px] h-[20px] absolute right-4"
            onClick={handleOnRemove}
          />
        )}
      </div>

      <div className="relative w-full">
        {isOpen ? (
          <div className="absolute bottom-[60px] z-10 w-full rounded-xl outline-none animate-in fade-in-0 zoom-in-95 bg-accent">
            <CommandList className="w-full rounded-lg">
              {options.length > 0 && !isLoading ? (
                <CommandGroup className="w-full max-h-[250px] overflow-auto">
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
                          "flex items-center gap-2 w-full"
                          // isSelected && "bg-white"
                        )}
                      >
                        {option.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}
            </CommandList>
          </div>
        ) : null}
      </div>
    </CommandPrimitive>
  );
};
