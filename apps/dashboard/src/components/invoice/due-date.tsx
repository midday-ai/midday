import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { TZDate } from "@date-fns/tz";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function DueDate() {
  const { setValue, watch } = useFormContext<InvoiceFormValues>();
  const dueDate = watch("due_date");
  const dateFormat = watch("template.date_format");

  const [isOpen, setIsOpen] = useState(false);

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("due_date", date, { shouldValidate: true, shouldDirty: true });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center">
        <LabelInput
          name="template.due_date_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              due_date_label: value,
            });
          }}
        />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger className="text-primary text-[11px] font-mono whitespace-nowrap flex">
          {dueDate && format(dueDate, dateFormat)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dueDate ? new TZDate(dueDate, "UTC") : undefined}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
