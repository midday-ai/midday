import { Breadcrumbs } from "@/components/breadcrumbs";
import { Table } from "@/components/tables/vault";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
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
          <Button
            variant="outline"
            className="w-[32px] h-[32px]"
            size="icon"
            disabled={disableActions}
          >
            <Icons.FileUpload />
          </Button>
          <Button
            variant="outline"
            className="w-[32px] h-[32px]"
            size="icon"
            disabled={disableActions}
          >
            <Icons.CreateNewFolder />
          </Button>
        </div>
      </div>
      <Table path={params?.folders?.join("/")} />
    </div>
  );
}
