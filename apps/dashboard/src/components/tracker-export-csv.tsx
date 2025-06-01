import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@midday/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import Papa from "papaparse";
import React, { useState } from "react";
import type { DateRange } from "react-day-picker";

interface TrackerEntry {
  date: string;
  description?: string | null;
  duration?: number | null;
  assigned?: { full_name: string } | null;
}

type Props = {
  name: string;
  projectId: string;
};

export function TrackerExportCSV({ name, projectId }: Props) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  async function downloadCSV() {
    if (!date?.from || !date?.to) return;

    const queryOptions = trpc.trackerEntries.byRange.queryOptions({
      from: date?.from?.toISOString(),
      to: date?.to?.toISOString(),
      projectId,
    });

    const data = await queryClient.fetchQuery(queryOptions);

    const entries = Object.values(data?.result ?? {}).flat() as TrackerEntry[];

    const formattedData = entries.map((item: TrackerEntry) => {
      const formattedItem: Record<string, string | null> = {
        Date: format(new Date(item.date), user?.dateFormat ?? "P"),
        Description: item.description ?? null,
        Time: secondsToHoursAndMinutes(item.duration ?? 0),
        Assigned: item.assigned?.full_name ?? null,
      };

      return formattedItem;
    });

    const totalTimeInSeconds = data?.meta?.totalDuration ?? 0;

    const dataWithFooter = [
      ...(formattedData ?? []),
      {
        Date: "Total Time",
        Assigned: null,
        Description: null,
        Time: secondsToHoursAndMinutes(totalTimeInSeconds),
      },
    ];

    const csv = Papa.unparse(dataWithFooter);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;

    link.setAttribute("download", `${name}.csv`);

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  }

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <Calendar
              mode="range"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date > new Date()}
              defaultMonth={date?.from}
            />

            <div className="p-4 space-y-4">
              <Button onClick={downloadCSV} className="w-full" disabled={!date}>
                Export
              </Button>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}
