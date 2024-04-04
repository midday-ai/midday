import { getCountryInfo } from "@midday/location";
import { getTrackerRecordsByRange } from "@midday/supabase/cached-queries";
import { getUser } from "@midday/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { TrackerHeader } from "./tracker-header";
import { TrackerWrapper } from "./tracker-wrapper";

export function TrackerWidgetSkeleton() {
  return <TrackerHeader />;
}

export async function TrackerWidget({ date, hideDaysIndicators }) {
  const currentDate = date ?? new Date();
  const userData = await getUser();
  const { currencyCode } = getCountryInfo();

  const { data, meta } = await getTrackerRecordsByRange({
    from: formatISO(startOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
    to: formatISO(endOfMonth(new Date(currentDate)), {
      representation: "date",
    }),
  });

  return (
    <TrackerWrapper
      hideDaysIndicators={hideDaysIndicators}
      data={data}
      meta={meta}
      date={currentDate}
      user={userData?.data}
      currencyCode={currencyCode}
    />
  );
}
