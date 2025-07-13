import { OAuthAuthorizationWrapper } from "@/components/oauth/oauth-authorization-wrapper";
import { loadOAuthParams } from "@/hooks/use-oauth-params";
import { HydrateClient, batchPrefetch } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";

export const metadata: Metadata = {
  title: "Authorize API Access | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const { response_type, client_id, redirect_uri, scope, state } =
    loadOAuthParams(searchParams);

  // Prefetch data for the consent screen if parameters are valid
  if (client_id && redirect_uri && scope && response_type === "code") {
    try {
      // Pre-validate and prefetch data optimistically
      batchPrefetch([
        trpc.oauthApplications.getApplicationInfo.queryOptions({
          clientId: client_id,
          redirectUri: redirect_uri,
          scope,
          state: state || undefined,
        }),
        trpc.team.list.queryOptions(),
      ]);
    } catch {
      // If prefetching fails, the wrapper will handle the error
    }
  }

  return (
    <HydrateClient>
      <OAuthAuthorizationWrapper
        response_type={response_type}
        client_id={client_id}
        redirect_uri={redirect_uri}
        scope={scope}
        state={state}
      />
    </HydrateClient>
  );
}
