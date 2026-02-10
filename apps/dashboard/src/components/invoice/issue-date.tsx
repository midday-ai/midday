import { TZDate } from "@date-fns/tz";
import { localDateToUTCMidnight } from "@midday/invoice/recurring";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useUserQuery } from "@/hooks/use-user";
import { LabelInput } from "./label-input";

export function IssueDate() {
  const { setValue, watch } = useFormContext();
  const { data: user } = useUserQuery();
  const issueDate = watch("issueDate");
  const dateFormat = watch("template.dateFormat");
  const [isOpen, setIsOpen] = useState(false);
  const { updateTemplate } = useTemplateUpdate();

  // Parse the ISO date string using TZDate to interpret it in UTC
  // This ensures the calendar shows the same date as stored (e.g., "2024-01-15T00:00:00.000Z" shows Jan 15)
  const selectedDate = useMemo(() => {
    if (!issueDate) return undefined;
    return new TZDate(issueDate, "UTC");
  }, [issueDate]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("issueDate", localDateToUTCMidnight(date), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center">
        <LabelInput
          name="template.issueDateLabel"
          onSave={(value) => {
            updateTemplate({ issueDateLabel: value });
          }}
        />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger className="text-primary text-[11px] whitespace-nowrap flex">
          {selectedDate && format(selectedDate, dateFormat)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
            defaultMonth={selectedDate}
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
