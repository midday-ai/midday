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
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { endOfMonth, format, startOfMonth } from "date-fns";
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
      .gte("date", new UTCDate(date?.from)?.toISOString())
      .lte("date", new UTCDate(date?.to)?.toISOString())
      .eq("project_id", projectId)
      .order("date");

    if (!includeTeam) {
      query.eq("assigned_id", userId);
    }

    const { data } = await query;

    const formattedData = data?.map((item) => {
      const formattedItem: Record<string, string | null> = {
        Date: format(item.date, "P"),
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
            <Calendar
              mode="range"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date > new Date()}
            />

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Include team</Label>
                <Switch
                  checked={includeTeam}
                  onCheckedChange={setIncludeTeam}
                />
              </div>
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
