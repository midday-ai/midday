import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealWizard } from "./deal-wizard";

export const metadata: Metadata = {
  title: "New Deal | Abacus",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewDealPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const merchant = await queryClient.fetchQuery(
    trpc.merchants.getById.queryOptions({ id: params.id }),
  );

  if (!merchant) {
    notFound();
  }

  return (
    <HydrateClient>
      <div className="p-6 space-y-6">
        <div>
          <Link
            href={`/merchants/${params.id}`}
            className="inline-flex items-center gap-1 text-sm text-[#606060] hover:text-primary transition-colors mb-4"
          >
            <Icons.ArrowLeft className="size-4" />
            Back to {merchant.name}
          </Link>

          <h1 className="text-2xl font-serif tracking-tight">New Deal</h1>
          <p className="text-sm text-[#606060] mt-1">
            Set up a new MCA deal for {merchant.name}
          </p>
        </div>

        <DealWizard merchant={merchant} />
      </div>
    </HydrateClient>
  );
}
