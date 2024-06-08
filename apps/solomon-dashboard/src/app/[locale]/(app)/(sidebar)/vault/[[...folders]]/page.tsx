import { Table } from "@/components/tables/vault";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Solomon AI",
};

export default function Vault({ params }) {
  const disableActions = [
    "exports",
    "inbox",
    "imports",
    "transactions",
  ].includes(params?.folders?.at(0));

  return <Table folders={params.folders} disableActions={disableActions} />;
}
