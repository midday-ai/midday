import { ChangeTimezone } from "@/components/change-timezone";
import { TimeFormatSettings } from "@/components/time-fromat-settings";
import { WeekSettings } from "@/components/week-settings";
import { getTimezone, getTimezones } from "@midday/location";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Date & Time | Midday",
};

export default async function Page() {
  const { data: userData } = await getUser();

  const timezone = userData?.timezone || getTimezone();
  const timezones = getTimezones();

  return (
    <div className="space-y-12">
      <ChangeTimezone value={timezone} timezones={timezones} />
      <TimeFormatSettings timeFormat={userData?.time_format} />
      <WeekSettings weekStartsOnMonday={userData?.week_starts_on_monday} />
    </div>
  );
}
