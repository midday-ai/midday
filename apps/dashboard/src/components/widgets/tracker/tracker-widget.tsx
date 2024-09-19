import { getCountryInfo } from "@absplatform/location";
import { getTrackerRecordsByRange } from "@absplatform/supabase/cached-queries";
import { getUser } from "@absplatform/supabase/cached-queries";
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

  const trackerData = await getTrackerRecordsByRange({
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
      data={trackerData?.data}
      meta={trackerData?.meta}
      date={currentDate}
      user={userData?.data}
      currencyCode={currencyCode}
    />
  );
}
