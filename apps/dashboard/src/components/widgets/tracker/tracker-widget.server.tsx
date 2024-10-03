import {
  getTrackerRecordsByRange,
  getUser,
} from "@midday/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { TrackerHeader } from "./tracker-header";
import { TrackerWidget } from "./tracker-widget";

export function TrackerWidgetSkeleton() {
  return <TrackerHeader />;
}

type Props = {
  date?: string;
};

export async function TrackerWidgetServer({ date }: Props) {
  const currentDate = date ?? formatISO(new Date(), { representation: "date" });

  const [{ data: userData }, trackerData] = await Promise.all([
    getUser(),
    getTrackerRecordsByRange({
      from: formatISO(startOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
      to: formatISO(endOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
    }),
  ]);

  return (
    <TrackerWidget
      data={trackerData?.data}
      date={currentDate}
      meta={trackerData?.meta}
      weekStartsOnMonday={userData?.week_starts_on_monday}
    />
  );
}
