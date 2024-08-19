import { Table } from "@/components/tables/vault";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

type Props = {
  params: { folders: string[] };
};

export default function Vault({ params }: Props) {
  const disableActions = [
    "exports",
    "inbox",
    "imports",
    "transactions",
  ].includes(params.folders?.[0] ?? "");

  return (
    <Table folders={params.folders ?? []} disableActions={disableActions} />
  );
}
