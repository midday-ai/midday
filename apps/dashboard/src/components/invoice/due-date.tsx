import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format } from "date-fns";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";
import type { InvoiceFormValues } from "./schema";

export function DueDate() {
  const { setValue, watch } = useFormContext<InvoiceFormValues>();
  const dueDate = watch("dueDate");
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("dueDate", date, { shouldValidate: true });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center">
        <LabelInput name="settings.dueDateLabel" />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger className="text-primary text-[11px] font-mono whitespace-nowrap flex">
          {format(dueDate || new Date(), "MM/dd/yyyy")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
