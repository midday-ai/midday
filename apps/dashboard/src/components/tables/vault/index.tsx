import { Breadcrumbs } from "@/components/breadcrumbs";
import { VaultSearchFilter } from "@/components/vault-search-filter";
import { getTeamMembers } from "@midday/supabase/cached-queries";
import { Suspense } from "react";
import { Loading } from "./data-table.loading";
import { DataTableServer } from "./data-table.server";

type Props = {
  folders: string[];
  disableActions: boolean;
  hideBreadcrumbs?: boolean;
};

export async function Table({ folders, disableActions, filter }: Props) {
  const members = await getTeamMembers();
  const teamId = members?.data?.at(0)?.team_id;

  return (
    <div>
      <div className="h-[32px] mt-6 mb-[21px] flex items-center justify-between mr-12">
        <Breadcrumbs
          folders={folders}
          hide={Object.values(filter).some((value) => value !== null)}
        />

        <VaultSearchFilter
          members={members?.data?.map((member) => ({
            id: member?.user?.id,
            name: member.user?.full_name,
          }))}
        />
      </div>

      <Suspense fallback={<Loading />}>
        <DataTableServer
          folders={folders}
          disableActions={disableActions}
          filter={filter}
          teamId={teamId}
        />
      </Suspense>
    </div>
  );
}
