"use client";

import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsById } from "@midday/supabase/queries";
import { useEffect, useState } from "react";
import { RecordSkeleton, UpdateRecordForm } from "./forms/update-record.form";

export function TrackerAddRecord({ assignedId, projectId, date, teamId }) {
  const supabase = createClient();
  const [isLoading, setLoading] = useState(true);
  const [records, setRecords] = useState();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await getTrackerRecordsById(supabase, {
          projectId,
          date,
          teamId,
        });
        setLoading(false);
        setRecords(data);
      } catch {
        setLoading(false);
      }
    }

    if (!records) {
      fetchData();
    }
  }, [date]);

  return (
    <div className="h-full mb-[120px] mt-8">
      <div className="sticky top-0 bg-[#FAFAF9] dark:bg-[#121212] z-20">
        <div className="flex justify-between items-center border-b-[1px] pb-3">
          <h2>Add record</h2>
        </div>
      </div>

      {isLoading && <RecordSkeleton />}

      {records?.map((record) => (
        <UpdateRecordForm
          key={record.id}
          duration={record.duration}
          assignedId={record.assigned_id}
        />
      ))}
    </div>
  );
}
