import { OAuthConsentScreen } from "@/components/oauth/oauth-consent-screen";
import { OAuthErrorMessage } from "@/components/oauth/oauth-error-message";
import { loadOAuthParams } from "@/hooks/use-oauth-params";
import { HydrateClient, getQueryClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import { categorizeOAuthError, validateOAuthParams } from "@/utils/oauth-utils";
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
  const { response_type, client_id, redirect_uri, scope, state } =
    loadOAuthParams(searchParams);

  // Validate OAuth parameters
  const validation = validateOAuthParams({
    response_type: response_type || undefined,
    client_id: client_id || undefined,
    redirect_uri: redirect_uri || undefined,
    scope: scope || undefined,
  });

  if (!validation.isValid) {
    return (
      <HydrateClient>
        <OAuthErrorMessage errorType={validation.errorType!} />
      </HydrateClient>
    );
  }

  // Validate OAuth application and parameters
  try {
    const queryClient = getQueryClient();

    // Validate the OAuth application info first
    await queryClient.fetchQuery(
      trpc.oauthApplications.getApplicationInfo.queryOptions({
        clientId: client_id!,
        redirectUri: redirect_uri!,
        scope: scope!,
        state: state || undefined,
      }),
    );

    // If validation passes, prefetch additional data for hydration
    await Promise.all([
      queryClient.prefetchQuery(trpc.user.me.queryOptions()),
      queryClient.prefetchQuery(
        trpc.oauthApplications.getApplicationInfo.queryOptions({
          clientId: client_id!,
          redirectUri: redirect_uri!,
          scope: scope!,
          state: state || undefined,
        }),
      ),
      queryClient.prefetchQuery(trpc.team.list.queryOptions()),
      queryClient.prefetchQuery(trpc.team.current.queryOptions()),
    ]);

    // Render the consent screen
    return (
      <HydrateClient>
        <Suspense>
          <OAuthConsentScreen />
        </Suspense>
      </HydrateClient>
    );
  } catch (error) {
    // Handle different types of validation errors
    const { errorType, customMessage, details } = categorizeOAuthError(error);

    return (
      <HydrateClient>
        <OAuthErrorMessage
          errorType={errorType}
          customMessage={customMessage}
          details={details}
        />
      </HydrateClient>
    );
  }
}
