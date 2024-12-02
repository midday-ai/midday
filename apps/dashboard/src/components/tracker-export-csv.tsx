import { secondsToHoursAndMinutes } from "@/utils/format";
import { UTCDate } from "@date-fns/utc";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import Papa from "papaparse";
import React, { useState } from "react";
import type { DateRange } from "react-day-picker";

type Props = {
  name: string;
  projectId: string;
  teamId: string;
  userId: string;
};

export function TrackerExportCSV({ name, teamId, projectId, userId }: Props) {
  const [includeTeam, setIncludeTeam] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const supabase = createClient();

  async function downloadCSV() {
    const query = supabase
      .from("tracker_entries")
      .select(
        "date, description, duration, assigned:assigned_id(id, full_name), project:project_id(id, name)",
      )
      .eq("team_id", teamId)
      .gte("date", date?.from?.toISOString())
      .lte("date", date?.to?.toISOString())
      .eq("project_id", projectId)
      .order("date");

    if (!includeTeam) {
      query.eq("assigned_id", userId);
    }

    const { data } = await query;

    const formattedData = data?.map((item) => {
      const formattedItem: Record<string, string | null> = {
        Date: format(new Date(item.date), "P"),
        Description: item.description,
        Time: secondsToHoursAndMinutes(item.duration ?? 0),
      };

      if (includeTeam) {
        formattedItem.Assigned = item.assigned?.full_name ?? null;
      }

      const { Date: date, Assigned, Description, Time } = formattedItem;

      return includeTeam
        ? { Date: date, Assigned, Description, Time }
        : { Date: date, Description, Time };
    });

    const totalTimeInSeconds =
      data?.reduce((sum, item) => sum + (item?.duration ?? 0), 0) ?? 0;

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
            <div className="pt-2 px-4">
              <Select
                defaultValue="this-month"
                onValueChange={(value) => {
                  const now = new UTCDate();
                  if (value === "this-month") {
                    const firstDayThisMonth = startOfMonth(now);
                    const lastDayThisMonth = endOfMonth(now);
                    setDate({
                      from: firstDayThisMonth,
                      to: lastDayThisMonth,
                    });
                  } else if (value === "last-month") {
                    const firstDayLastMonth = startOfMonth(subMonths(now, 1));
                    const lastDayLastMonth = endOfMonth(subMonths(now, 1));
                    setDate({
                      from: firstDayLastMonth,
                      to: lastDayLastMonth,
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This month</SelectItem>
                  <SelectItem value="last-month">Last month</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
