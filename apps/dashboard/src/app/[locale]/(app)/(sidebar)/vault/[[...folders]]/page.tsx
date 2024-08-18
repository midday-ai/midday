import { Table } from "@/components/tables/vault";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

type Props = {
  params: {
    folders: string[];
  };
};

export default function Vault({ params }: Props) {
  return <Table folders={params.folders ?? []} />;
}
