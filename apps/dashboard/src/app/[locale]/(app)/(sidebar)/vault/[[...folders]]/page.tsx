import { Table } from "@/components/tables/vault";
import { searchParamsCache } from "@/components/tables/vault/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
  params: {
    folders: string[];
    q?: string;
    owners?: string;
    start?: string;
    end?: string;
  };
};

export default function Vault({ params, searchParams }: Props) {
  const disableActions = [
    "exports",
    "inbox",
    "imports",
    "transactions",
    "invoices",
  ].includes(params.folders?.[0] ?? "");

  const filter = searchParamsCache.parse(searchParams);

  return (
    <Table
      folders={params.folders ?? []}
      disableActions={disableActions}
      filter={filter}
    />
  );
}
