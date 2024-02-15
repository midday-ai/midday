import { getTrackerRecordsByRange } from "@midday/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { TrackerWrapper } from "./tracker-wrapper";

export async function TrackerWidget({ date }) {
  const currentDate = date ?? new Date();

  const { data, meta } = await getTrackerRecordsByRange({
    from: formatISO(startOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
    to: formatISO(endOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
  });

  return <TrackerWrapper data={data} meta={meta} date={currentDate} />;
}
