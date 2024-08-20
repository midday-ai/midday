import { Breadcrumbs } from "@/components/breadcrumbs";
import { Suspense } from "react";
import { Loading } from "./data-table.loading";
import { DataTableServer } from "./data-table.server";
import { VaultActions } from "./vault-actions";

type Props = {
  folders: string[];
  disableActions: boolean;
};

export function Table({ folders, disableActions }: Props) {
  return (
    <div>
      <div className="h-[32px] mt-6">
        <Breadcrumbs folders={folders} />
      </div>

      <Suspense fallback={<Loading />}>
        <DataTableServer folders={folders} disableActions={disableActions} />
      </Suspense>
    </div>
  );
}
