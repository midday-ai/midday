import { Breadcrumbs } from "@/components/breadcrumbs";
import { Table } from "@/components/tables/vault";
import { CreateFolderButton } from "@/components/tables/vault/create-folder-button";
import { UploadButton } from "@/components/tables/vault/upload-button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

export default function Vault({ params }) {
  const disableActions = ["transactions", "inbox", "exports"].includes(
    params?.folders?.at(0)
  );

  return (
    <div>
      <div className="flex justify-between items-center mt-6 h-[32px]">
        <Breadcrumbs folders={params?.folders} />

        <div className="flex space-x-2">
          <CreateFolderButton disableActions={disableActions} />
          <UploadButton disableActions={disableActions} />
        </div>
      </div>
      <Table path={params?.folders?.join("/")} />
    </div>
  );
}
