import { DealViewWrapper } from "@/components/deal-view-wrapper";
import { getQueryClient, trpc } from "@/trpc/server";
import { decrypt } from "@midday/encryption";
import { HtmlTemplate } from "@midday/deal/templates/html";
import { createClient } from "@midday/supabase/server";
import { waitUntil } from "@vercel/functions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SearchParams } from "nuqs";

export async function generateMetadata(props: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();

  try {
    const deal = await queryClient.fetchQuery(
      trpc.deal.getDealByToken.queryOptions({
        token: params.token,
      }),
    );

    if (!deal) {
      return {
        title: "Deal Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const title = `Deal ${deal.dealNumber} | ${deal.team?.name}`;
    const description = `Deal for ${deal.merchantName || deal.merchant?.name || "Merchant"}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (error) {
    return {
      title: "Deal Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<SearchParams>;
};

async function updateDealViewedAt(id: string) {
  const supabase = await createClient({ admin: true });

  await supabase
    .from("deals")
    .update({
      viewed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export default async function Page(props: Props) {
  const params = await props.params;
  const supabase = await createClient({ admin: true });
  const searchParams = await props.searchParams;
  const viewerParam = searchParams?.viewer as string | undefined;
  const viewer = viewerParam ? decodeURIComponent(viewerParam) : undefined;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const queryClient = getQueryClient();

  const deal = await queryClient.fetchQuery(
    trpc.deal.getDealByToken.queryOptions({
      token: params.token,
    }),
  );

  if (!deal) {
    notFound();
  }

  if (viewer && viewer.trim().length > 0) {
    try {
      const decryptedEmail = decrypt(viewer);

      if (decryptedEmail === deal?.merchant?.email) {
        // Only update the deal viewed_at if the user is a viewer
        waitUntil(updateDealViewedAt(deal.id!));
      }
    } catch (error) {
      // Silently fail if decryption fails - viewer might be invalid or malformed
      // This is expected when accessing the deal without a valid viewer parameter
    }
  }

  // If the deal is draft and the user is not logged in, return 404 or if the deal is not found
  if (!deal || (deal.status === "draft" && !session)) {
    notFound();
  }

  const width = deal.template.size === "letter" ? 750 : 595;
  const height = deal.template.size === "letter" ? 1056 : 842;

  // Payment is only enabled if: template has it enabled AND team has Stripe connected
  const paymentEnabled =
    deal.template.paymentEnabled && deal.team?.stripeConnected === true;

  return (
    <>
      <DealViewWrapper
        token={deal.token}
        dealNumber={deal.dealNumber || "deal"}
        paymentEnabled={paymentEnabled}
        amount={deal.amount ?? undefined}
        currency={deal.currency ?? undefined}
        initialStatus={deal.status}
        merchantName={
          deal.merchantName || (deal.merchant?.name as string)
        }
        merchantWebsite={deal.merchant?.website}
        merchantPortalEnabled={deal.merchant?.portalEnabled ?? false}
        merchantPortalId={deal.merchant?.portalId ?? undefined}
        dealWidth={width}
      >
        <div className="pb-24 md:pb-0">
          <div className="shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]">
            <HtmlTemplate data={deal} width={width} height={height} />
          </div>
        </div>
      </DealViewWrapper>

      <div className="fixed bottom-4 right-4 hidden md:block">
        <a
          href="https://abacuslabs.co?utm_source=deal"
          target="_blank"
          rel="noreferrer"
          className="text-[9px] text-[#878787]"
        >
          Powered by <span className="text-primary">abacus</span>
        </a>
      </div>
    </>
  );
}
