"use client";

import { Command as CommandPrimitive } from "cmdk";
import { useCallback, useRef, useState } from "react";
import { cn } from "../utils";
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Icons } from "./icons";
import { Spinner } from "./spinner";

export type Option = {
  id: string;
  name: string;
  component?: () => React.ReactNode;
  data?: unknown;
};

type ComboboxProps = {
  options: Option[];
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
  CreateComponent?: React.ComponentType<{ value: string }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
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
  open: controlledOpen,
  onOpenChange,
  onFocus,
}: ComboboxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalIsOpen, setInternalOpen] = useState(false);
  const [selected, setSelected] = useState<Option | undefined>(value as Option);
  const [inputValue, setInputValue] = useState<string>(value?.name || "");

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const handleOnValueChange = (value: string) => {
    setInputValue(value);
    onValueChange?.(value);

    if (value) {
      handleOpenChange(true);
    } else {
      handleOpenChange(false);
    }
  };

  const handleOnRemove = () => {
    setSelected(undefined);
    setInputValue("");
    onRemove?.();
  };

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!inputRef.current?.contains(document.activeElement)) {
        handleOpenChange(false);
        setInputValue(selected?.name ?? "");
      }
    }, 150);
  }, [selected, handleOpenChange]);

  const handleOnFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
  };

  const handleSelectOption = useCallback(
    (selectedOption: Option) => {
      setInputValue(selectedOption.name);

      setSelected(selectedOption);
      onSelect?.(selectedOption);

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
          <Spinner className="w-[16px] h-[16px] absolute right-2 text-dark-gray" />
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
          {isOpen && (
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
