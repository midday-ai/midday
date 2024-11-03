import { Cookies } from "@/utils/constants";
import { getUser } from "@midday/supabase/cached-queries";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { CustomerCreateSheet } from "./customer-create-sheet";
import { CustomerEditSheet } from "./customer-edit-sheet";
import { InvoiceCommentsSheet } from "./invoice-comments";
import { InvoiceCreateSheetServer } from "./invoice-create-sheet.server";
import { TrackerCreateSheet } from "./tracker-create-sheet";
import { TrackerScheduleSheet } from "./tracker-schedule-sheet";
import { TrackerUpdateSheet } from "./tracker-update-sheet";

type Props = {
  defaultCurrency: string;
};

export async function GlobalSheets({ defaultCurrency }: Props) {
  const { data: userData } = await getUser();
  const projectId = cookies().get(Cookies.LastProject)?.value;

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
        lastProjectId={projectId}
      />

      <CustomerCreateSheet />
      <CustomerEditSheet />
      <InvoiceCommentsSheet />

      <Suspense fallback={null}>
        {/* We preload the invoice data (template, invoice number etc) */}
        <InvoiceCreateSheetServer teamId={userData?.team_id} />
      </Suspense>
    </>
  );
}
