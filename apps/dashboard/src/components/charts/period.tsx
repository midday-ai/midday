import { DateRangePicker } from "@midday/ui/date-range-picker";
import { Icons } from "@midday/ui/icons";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { cn } from "@midday/ui/utils";

export function Period() {
  return (
    <div className={cn("flex space-x-4")}>
      <DateRangePicker formattedValue="Oct 08, 2022 - Oct 08, 2023" />

      <Select>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Monthly" />
        </SelectTrigger>
        <SelectContent className="mt-1">
          <SelectGroup>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
