import { Cookies } from "@/utils/constants";
import { getCustomers } from "@midday/supabase/cached-queries";
import { cookies } from "next/headers";
import { TrackerCreateSheet } from "./tracker-create-sheet";
import { TrackerScheduleSheet } from "./tracker-schedule-sheet";
import { TrackerUpdateSheet } from "./tracker-update-sheet";

type Props = {
  teamId: string;
  userId: string;
  timeFormat: number;
  defaultCurrency: string;
};

export async function TrackerSheetsServer({
  teamId,
  userId,
  timeFormat,
  defaultCurrency,
}: Props) {
  const { data: customers } = await getCustomers();

  const projectId = cookies().get(Cookies.LastProject)?.value;

  return (
    <>
      <TrackerUpdateSheet
        teamId={teamId}
        userId={userId}
        customers={customers}
      />

      <TrackerCreateSheet
        currencyCode={defaultCurrency}
        customers={customers}
      />

      <TrackerScheduleSheet
        teamId={teamId}
        userId={userId}
        timeFormat={timeFormat}
        lastProjectId={projectId}
      />
    </>
  );
}
