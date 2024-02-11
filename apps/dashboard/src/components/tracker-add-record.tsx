"use client";

import { TrackerEntriesList } from "@/components/tracker-entries-list";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsById } from "@midday/supabase/queries";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { RecordSkeleton } from "./forms/update-record.form";

export function TrackerAddRecord({ projectId, date, teamId, assignedId }) {
  const supabase = createClient();
  const [isLoading, setLoading] = useState(true);
  const [records, setRecords] = useState();

  async function fetchData() {
    try {
      const { data } = await getTrackerRecordsById(supabase, {
        projectId,
        date,
        teamId,
      });

      setLoading(false);

      if (data.length) {
        setRecords(data);
      } else {
        setRecords([
          {
            id: uuidv4(),
            project_id: projectId,
            duration: 0,
            date,
            assigned_id: assignedId,
          },
        ]);
      }
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!records) {
      fetchData();
    }
  }, [date]);

  return (
    <div className="h-full mb-[120px] mt-8">
      <div className="sticky top-0 bg-[#FAFAF9] dark:bg-[#121212] z-20">
        <div className="flex justify-between items-center border-b-[1px] pb-3">
          <h2>Add time</h2>
        </div>
      </div>

      {isLoading && <RecordSkeleton />}

      <TrackerEntriesList
        data={records}
        date={date}
        projectId={projectId}
        fetchData={fetchData}
        assignedId={assignedId}
      />
    </div>
  );
}
