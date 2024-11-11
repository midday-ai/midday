"use client";

import { cn } from "@midday/ui/cn";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

export interface ContentEditableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
}

export function ContentEditable({
  className,
  name,
  ...props
}: ContentEditableProps) {
  const { register, watch, setValue } = useFormContext();
  const [isFocused, setIsFocused] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fieldValue = watch(name);

  const { ref, ...rest } = register(name);

  useEffect(() => {
    if (contentEditableRef.current) {
      contentEditableRef.current.textContent = fieldValue || "";
    }
  }, [fieldValue]);

  const isPlaceholder = !fieldValue && !isFocused;

  const handleInput = () => {
    const value = contentEditableRef.current?.textContent || "";

    setValue(name, value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="relative">
      <div
        {...props}
        {...rest}
        ref={(el) => {
          ref(el);
          contentEditableRef.current = el;
        }}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "border-0 p-0 border-b border-transparent focus:border-border font-mono text-xs outline-none",
          isPlaceholder && "opacity-0",
          className,
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={handleInput}
      />
      {isPlaceholder && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        </div>
      )}
    </div>
  );
}
