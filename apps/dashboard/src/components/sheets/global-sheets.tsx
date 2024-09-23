import { getUser } from "@midday/supabase/cached-queries";
import { TrackerCreateSheet } from "./tracker-create-sheet";
import { TrackerScheduleSheet } from "./tracker-schedule-sheet";
import { TrackerUpdateSheet } from "./tracker-update-sheet";

type Props = {
  defaultCurrency: string;
};

export async function GlobalSheets({ defaultCurrency }: Props) {
  const { data: userData } = await getUser();

  return (
    <>
      <TrackerUpdateSheet teamId={userData?.team_id} userId={userData?.id} />
      <TrackerCreateSheet
        currencyCode={defaultCurrency}
        teamId={userData?.team_id}
      />
      <TrackerScheduleSheet
        teamId={userData?.team_id}
        userId={userData?.id}
        timeFormat={userData?.time_format}
      />
    </>
  );
}
