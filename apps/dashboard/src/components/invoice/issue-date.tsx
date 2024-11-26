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

export function IssueDate() {
  const { setValue, watch } = useFormContext<InvoiceFormValues>();
  const issueDate = watch("issue_date");
  const dateFormat = watch("template.date_format");
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("issue_date", date, { shouldValidate: true, shouldDirty: true });
      setIsOpen(false);
    }
  };

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center">
        <LabelInput
          name="template.issue_date_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              issue_date_label: value,
            });
          }}
        />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger className="text-primary text-[11px] font-mono whitespace-nowrap flex">
          {issueDate && format(issueDate, dateFormat)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={issueDate ? new TZDate(issueDate, "UTC") : undefined}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
