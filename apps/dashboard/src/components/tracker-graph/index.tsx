import { getTrackerRecordsByRange } from "@absplatform/supabase/cached-queries";
import { getUser } from "@absplatform/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth, subMonths } from "date-fns";
import { TrackerGraph as TrackerGraphComponent } from "./tracker-graph";

export async function TrackerGraph({ date, projectId }) {
  const currentDate = date ? new Date(date) : new Date();
  const numberOfMonths = 6;
  const { data: userData } = await getUser();

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
      weekStartsOn={userData.week_starts_on_monday && 1}
    />
  );
}
