"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useQueryState } from "nuqs";

export function TrackerChangeStatus() {
  const [status, setStatus] = useQueryState("status", {
    shallow: false,
    defaultValue: "all",
  });

  const handleChangeStatus = (value: string) => {
    if (value === "all") {
      setStatus(null);
    } else {
      setStatus(value);
    }
  };

  return (
    <Select onValueChange={handleChangeStatus} value={status}>
      <SelectTrigger className="min-w-[120px]">
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  );
}
