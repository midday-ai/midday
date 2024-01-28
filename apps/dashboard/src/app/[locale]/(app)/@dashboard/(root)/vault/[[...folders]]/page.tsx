import { Table } from "@/components/tables/vault";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

export default function Vault({ params }) {
  const disableActions = ["exports"].includes(params?.folders?.at(0));

  return <Table folders={params.folders} disableActions={disableActions} />;
}
