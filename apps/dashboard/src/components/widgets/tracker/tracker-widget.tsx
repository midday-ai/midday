import { getTrackerRecordsByRange } from "@midday/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { TrackerBlah } from "./tracker-blah";

export async function TrackerWidget() {
  const currentDate = new Date();

  const { data, meta } = await getTrackerRecordsByRange({
    from: formatISO(startOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
    to: formatISO(endOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
  });

  return <TrackerBlah data={data} meta={meta} date={currentDate} />;
}
