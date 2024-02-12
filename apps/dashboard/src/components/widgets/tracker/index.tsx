"use client";

import { ErrorFallback } from "@/components/error-fallback";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByRange } from "@midday/supabase/queries";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { useEffect, useState } from "react";
import { TrackerHeader } from "./tracker-header";
import { TrackerWidget } from "./tracker-widget";

export function Tracker() {
  const supabase = createClient();
  const [date, setDate] = useState(new Date().toString());
  const [data, setData] = useState();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await getTrackerRecordsByRange(supabase, {
          from: formatISO(startOfMonth(new Date(date)), {
            representation: "date",
          }),
          to: formatISO(endOfMonth(new Date(date)), { representation: "date" }),
          teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
        });

        if (data) {
          setData(data);
        }
      } catch {}
    }

    fetchData();
  }, [date]);

  return (
    <div className="flex-1 border p-8 relative h-full">
      <TrackerHeader date={date} setDate={setDate} />

      <div className="mt-10">
        <ErrorBoundary errorComponent={ErrorFallback}>
          <TrackerWidget data={data} date={date} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
