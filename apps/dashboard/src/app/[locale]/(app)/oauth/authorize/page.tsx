import { OAuthConsentScreen } from "@/components/oauth/oauth-consent-screen";
import { loadOAuthParams } from "@/hooks/use-oauth-params";
import { HydrateClient, batchPrefetch } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Authorize API Access | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const { client_id, redirect_uri, scope, state } =
    loadOAuthParams(searchParams);

  batchPrefetch([
    trpc.oauthApplications.getApplicationInfo.queryOptions({
      clientId: client_id || "",
      redirectUri: redirect_uri || "",
      scope: scope || "",
      state: state || undefined,
    }),
    trpc.team.list.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <Suspense>
        <OAuthConsentScreen />
      </Suspense>
    </HydrateClient>
  );
}
