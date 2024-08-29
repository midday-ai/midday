import { Breadcrumbs } from "@/components/breadcrumbs";
import { VaultSettingsModal } from "@/components/modals/vault-settings-modal";
import { VaultSearchFilter } from "@/components/vault-search-filter";
import { getTeamMembers, getUser } from "@midday/supabase/cached-queries";
import { Suspense } from "react";
import { Loading } from "./data-table.loading";
import { DataTableServer } from "./data-table.server";

type Props = {
  folders: string[];
  disableActions: boolean;
  hideBreadcrumbs?: boolean;
};

export async function Table({ folders, disableActions, filter }: Props) {
  const [members, user] = await Promise.all([getTeamMembers(), getUser()]);

  const team = user?.data?.team;

  return (
    <div>
      <div className="h-[32px] mt-6 mb-[21px] flex items-center justify-between mr-11">
        <Breadcrumbs
          folders={folders}
          hide={Object.values(filter).some((value) => value !== null)}
        />

        <div className="flex items-center gap-2">
          <VaultSearchFilter
            members={members?.data?.map((member) => ({
              id: member?.user?.id,
              name: member.user?.full_name,
            }))}
          />

          <VaultSettingsModal
            documentClassification={team?.document_classification}
          />
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        <DataTableServer
          folders={folders}
          disableActions={disableActions}
          filter={filter}
          teamId={team?.id}
        />
      </Suspense>
    </div>
  );
}
