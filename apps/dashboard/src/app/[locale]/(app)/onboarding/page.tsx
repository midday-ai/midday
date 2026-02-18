import { getCountryCode, getCurrency } from "@midday/location";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingPage } from "@/components/onboarding/onboarding-page";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Onboarding | Midday",
};

export default async function Page() {
  const queryClient = getQueryClient();

  const user = await queryClient
    .fetchQuery(trpc.user.me.queryOptions())
    .catch(() => redirect("/login"));

  if (!user) {
    redirect("/login");
  }

  const currency = getCurrency();
  const countryCode = getCountryCode();

  return (
    <HydrateClient>
      <OnboardingPage
        defaultCurrencyPromise={currency}
        defaultCountryCodePromise={countryCode}
        user={{
          id: user.id,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl ?? null,
          teamId: user.teamId,
        }}
      />
    </HydrateClient>
  );
}
