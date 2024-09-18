import { getTrackerRecordsByRange } from "@midday/supabase/cached-queries";
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

  const trackerData = await getTrackerRecordsByRange({
    from: formatISO(startOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
    to: formatISO(endOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
  });

  return (
    <TrackerWidget
      data={trackerData?.data}
      date={currentDate}
      meta={trackerData?.meta}
    />
  );
}
