"use client";

import { cn } from "@midday/ui/cn";
import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTemplateUpdate } from "@/hooks/use-template-update";

export function InvoiceTitle() {
  const { control, watch } = useFormContext();
  const invoiceTitle = watch("template.title") ?? "";
  const { updateTemplate } = useTemplateUpdate();
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isPlaceholder = invoiceTitle.trim().length === 0 && !isFocused;
  const SINGLE_LINE_HEIGHT = 24;
  const TWO_LINES_HEIGHT = 48;
  const GROW_THRESHOLD = 36;

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = `${SINGLE_LINE_HEIGHT}px`;
    // Some browsers report one-line textarea scrollHeight > 24px because of font metrics.
    // Only grow when we're clearly beyond one line.
    const needsSecondLine = el.scrollHeight > GROW_THRESHOLD;
    el.style.height = needsSecondLine
      ? `${TWO_LINES_HEIGHT}px`
      : `${SINGLE_LINE_HEIGHT}px`;
  };

  useEffect(() => {
    resize();
  }, [invoiceTitle]);

  return (
    <div className="relative w-full min-w-0">
      <Controller
        name="template.title"
        control={control}
        render={({ field }) => (
          <textarea
            ref={(el) => {
              textareaRef.current = el;
              field.ref(el);
            }}
            value={field.value ?? ""}
            lang="en"
            rows={1}
            className={cn(
              "block w-full min-w-0 text-[21px] leading-6 font-serif mb-2 h-6 max-h-12 bg-transparent p-0 border-0 outline-none resize-none overflow-hidden",
              isPlaceholder && "opacity-0",
            )}
            style={{
              wordBreak: "normal",
              overflowWrap: "break-word",
              hyphens: "auto",
            }}
            onInput={resize}
            onChange={(e) => field.onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              field.onBlur();
              setIsFocused(false);
              updateTemplate({ title: e.currentTarget.value });
            }}
          />
        )}
      />
      {isPlaceholder && (
        <div className="absolute left-0 top-0 h-6 w-[250px] pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        </div>
      )}
    </div>
  );
}
