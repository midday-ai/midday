import { getTrackerRecordsByRange } from "@midday/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth, subMonths } from "date-fns";
import { TrackerGraph as TrackerGraphComponent } from "./tracker-graph";

export async function TrackerGraph({ date, projectId }) {
  const currentDate = date ? new Date(date) : new Date();
  const numberOfMonths = 6;

  const start = startOfMonth(subMonths(currentDate, numberOfMonths));
  const end = endOfMonth(currentDate);

  const { data, meta } = await getTrackerRecordsByRange({
    projectId,
    from: formatISO(start, {
      representation: "date",
    }),
    to: formatISO(end, {
      representation: "date",
    }),
  });

  return (
    <TrackerGraphComponent
      data={data}
      meta={meta}
      date={currentDate}
      start={start}
      end={end}
      numberOfMonths={numberOfMonths}
      projectId={projectId}
    />
  );
}
