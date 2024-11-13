import { ChangeTimezone } from "@/components/change-timezone";
import { DateFormatSettings } from "@/components/date-format-settings";
import { LocaleSettings } from "@/components/locale-settings";
import { TimeFormatSettings } from "@/components/time-format-settings";
import { WeekSettings } from "@/components/week-settings";
import { getTimezones } from "@midday/location";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Date & Locale | Midday",
};

export default async function Page() {
  const { data: userData } = await getUser();

  const timezones = getTimezones();

  return (
    <div className="space-y-12">
      <LocaleSettings locale={userData?.locale} />
      <ChangeTimezone timezone={userData?.timezone} timezones={timezones} />
      <TimeFormatSettings timeFormat={userData?.time_format} />
      <DateFormatSettings dateFormat={userData?.date_format} />
      <WeekSettings weekStartsOnMonday={userData?.week_starts_on_monday} />
    </div>
  );
}
