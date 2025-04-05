import { Table } from "@/components/tables/vault";
import { searchParamsCache } from "@/components/tables/vault/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{
    folders: string[];
    q?: string;
    owners?: string;
    start?: string;
    end?: string;
  }>;
};

export default async function Vault(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
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
