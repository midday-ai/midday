import { useTemplateUpdate } from "@/hooks/use-template-update";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format, parseISO, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function DueDate() {
  const { setValue, watch } = useFormContext();
  const dueDate = watch("dueDate");
  const dateFormat = watch("template.dateFormat");

  const [isOpen, setIsOpen] = useState(false);
  const { updateTemplate } = useTemplateUpdate();

  // Parse the ISO date string to a local Date for calendar display
  // This ensures the calendar shows the same date as the display text
  const selectedDate = useMemo(() => {
    if (!dueDate) return undefined;
    // Parse ISO string and get just the date part in local time
    const parsed = parseISO(dueDate);
    return startOfDay(parsed);
  }, [dueDate]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("dueDate", date.toISOString(), {
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
          name="template.dueDateLabel"
          onSave={(value) => {
            updateTemplate({ dueDateLabel: value });
          }}
        />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger className="text-primary text-[11px] whitespace-nowrap flex">
          {dueDate && format(dueDate, dateFormat)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            month={selectedDate}
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
